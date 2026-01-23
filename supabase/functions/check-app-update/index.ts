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

    console.log("Checking update for:", { currentVersion, platform });

    // Get the latest active version
    const { data: latestVersion, error } = await supabase
      .from("app_versions")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching latest version:", error);
      return new Response(
        JSON.stringify({ hasUpdate: false, error: "No active version found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!latestVersion) {
      console.log("No active version found");
      return new Response(
        JSON.stringify({ hasUpdate: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Latest version from DB:", latestVersion.version);
    console.log("Current client version:", currentVersion);

    // Compare versions using semantic versioning
    const comparison = compareVersions(latestVersion.version, currentVersion);
    const hasUpdate = comparison > 0;

    console.log("Version comparison result:", comparison, "hasUpdate:", hasUpdate);

    if (hasUpdate) {
      const response: UpdateResponse = {
        hasUpdate: true,
        version: latestVersion.version,
        bundleUrl: latestVersion.bundle_url,
        isMandatory: latestVersion.is_mandatory || false,
        releaseNotes: latestVersion.release_notes,
      };
      
      console.log("Sending update response:", response);
      
      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("No update needed, client is up to date");
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