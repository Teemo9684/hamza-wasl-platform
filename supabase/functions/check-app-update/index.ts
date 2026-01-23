import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateRequest {
  currentVersion: string;
  platform: string;
}

interface UpdateResponse {
  hasUpdate: boolean;
  version?: string;
  bundleUrl?: string;
  isMandatory?: boolean;
  releaseNotes?: string;
}

interface PublishedVersion {
  version: string;
  buildTime: string;
  isMandatory?: boolean;
  releaseNotes?: string;
}

// Compare semantic versions
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

// Fetch published version from the live website
async function fetchPublishedVersion(): Promise<PublishedVersion | null> {
  try {
    // URL of the published website's version.json
    const publishedUrl = "https://hamza-wasl-platform.lovable.app/version.json";
    
    console.log("Fetching published version from:", publishedUrl);
    
    const response = await fetch(publishedUrl, {
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    });
    
    if (!response.ok) {
      console.error("Failed to fetch published version:", response.status, response.statusText);
      return null;
    }
    
    const data: PublishedVersion = await response.json();
    console.log("Published version data:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching published version:", error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { currentVersion, platform }: UpdateRequest = await req.json();

    console.log("=== UPDATE CHECK START ===");
    console.log("Checking update for:", { currentVersion, platform });

    // الأولوية 1: جلب الإصدار من الموقع المنشور
    const publishedVersion = await fetchPublishedVersion();
    
    if (publishedVersion) {
      console.log("Published website version:", publishedVersion.version);
      console.log("Client version:", currentVersion);
      
      const comparison = compareVersions(publishedVersion.version, currentVersion);
      const hasUpdate = comparison > 0;
      
      console.log("Comparison result:", comparison, "hasUpdate:", hasUpdate);
      
      if (hasUpdate) {
        // البحث عن bundle URL في قاعدة البيانات أو إنشاء رابط للأصول المنشورة
        // أولاً: البحث في جدول app_versions
        const { data: dbVersion } = await supabase
          .from("app_versions")
          .select("bundle_url, is_mandatory, release_notes")
          .eq("version", publishedVersion.version)
          .eq("is_active", true)
          .single();
        
        // إذا وُجد في قاعدة البيانات، استخدم الـ bundle_url منها
        if (dbVersion?.bundle_url) {
          console.log("Found bundle in database for version:", publishedVersion.version);
          
          const response: UpdateResponse = {
            hasUpdate: true,
            version: publishedVersion.version,
            bundleUrl: dbVersion.bundle_url,
            isMandatory: dbVersion.is_mandatory || publishedVersion.isMandatory || false,
            releaseNotes: publishedVersion.releaseNotes || dbVersion.release_notes,
          };
          
          return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // إذا لم يوجد bundle، أعلم المستخدم أن هناك تحديث متاح
        // لكن لا يمكن تطبيقه تلقائياً (يحتاج رفع bundle يدوياً)
        console.log("No bundle found for version:", publishedVersion.version);
        console.log("Update available but requires manual bundle upload");
        
        // تسجيل الإصدار الجديد تلقائياً (بدون bundle)
        const { error: insertError } = await supabase
          .from("app_versions")
          .upsert({
            version: publishedVersion.version,
            bundle_id: `auto-${publishedVersion.version}`,
            bundle_url: "", // سيتم رفعه لاحقاً
            is_active: false, // غير مفعّل حتى يُرفع الـ bundle
            is_mandatory: publishedVersion.isMandatory || false,
            release_notes: publishedVersion.releaseNotes || `الإصدار ${publishedVersion.version}`,
          }, {
            onConflict: "version",
            ignoreDuplicates: true,
          });
        
        if (insertError) {
          console.error("Error auto-registering version:", insertError);
        } else {
          console.log("Auto-registered version (awaiting bundle):", publishedVersion.version);
        }
        
        // لا نُرجع تحديث لأنه لا يوجد bundle
        return new Response(
          JSON.stringify({ 
            hasUpdate: false,
            message: "Update available but bundle not uploaded yet",
            pendingVersion: publishedVersion.version,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Client is up to date with published version");
      return new Response(
        JSON.stringify({ hasUpdate: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // الأولوية 2: إذا فشل جلب الإصدار المنشور، استخدم قاعدة البيانات
    console.log("Falling back to database check...");
    
    const { data: latestVersion, error } = await supabase
      .from("app_versions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !latestVersion) {
      console.log("No active version found in database");
      return new Response(
        JSON.stringify({ hasUpdate: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Latest version from DB:", latestVersion.version);
    
    const comparison = compareVersions(latestVersion.version, currentVersion);
    const hasUpdate = comparison > 0;

    if (hasUpdate) {
      const response: UpdateResponse = {
        hasUpdate: true,
        version: latestVersion.version,
        bundleUrl: latestVersion.bundle_url,
        isMandatory: latestVersion.is_mandatory || false,
        releaseNotes: latestVersion.release_notes,
      };
      
      console.log("Sending update from database:", response);
      
      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("=== UPDATE CHECK END: No update needed ===");
    return new Response(
      JSON.stringify({ hasUpdate: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-app-update:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ hasUpdate: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
