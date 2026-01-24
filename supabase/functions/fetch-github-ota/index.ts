import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubWorkflowRun {
  id: number;
  run_number: number;
  status: string;
  conclusion: string;
  created_at: string;
  head_commit: {
    message: string;
  } | null;
}

interface GitHubArtifact {
  id: number;
  name: string;
  size_in_bytes: number;
  created_at: string;
  expires_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    const githubRepo = Deno.env.get('GITHUB_REPO');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!githubToken || !githubRepo) {
      console.error('Missing GITHUB_TOKEN or GITHUB_REPO environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'GitHub configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for optional parameters
    let version: string | undefined;
    let releaseNotes: string | undefined;
    let isMandatory = false;
    let minAppVersion = "1.0.0";
    
    try {
      const body = await req.json();
      version = body.version;
      releaseNotes = body.releaseNotes;
      isMandatory = body.isMandatory || false;
      minAppVersion = body.minAppVersion || "1.0.0";
    } catch {
      // No body provided, will use defaults
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching OTA bundle from repository: ${githubRepo}`);

    // Get the latest workflow runs
    const runsResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/build-android.yml/runs?status=success&per_page=5`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-App',
        },
      }
    );

    if (!runsResponse.ok) {
      const errorText = await runsResponse.text();
      console.error(`Failed to fetch workflow runs: ${runsResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في جلب بيانات البناء', details: errorText }),
        { status: runsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const runsData = await runsResponse.json();
    
    if (!runsData.workflow_runs || runsData.workflow_runs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'لا يوجد بناء متاح',
          message: 'لم يتم العثور على أي بناء ناجح. قم ببناء التطبيق أولاً.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const latestRun: GitHubWorkflowRun = runsData.workflow_runs[0];
    console.log(`Latest successful run ID: ${latestRun.id}, Run #${latestRun.run_number}`);

    // Extract version from commit message if not provided
    const commitMessage = latestRun.head_commit?.message || '';
    if (!version) {
      // Try to extract version from commit message (e.g., "v1.2.3" or "1.2.3")
      const versionMatch = commitMessage.match(/v?(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        version = versionMatch[1];
      } else {
        // Generate version based on run number
        version = `1.0.${latestRun.run_number}`;
      }
    }

    // Use commit message as release notes if not provided
    if (!releaseNotes && commitMessage) {
      releaseNotes = commitMessage;
    }

    console.log(`Using version: ${version}, Release notes: ${releaseNotes}`);

    // Check if this version already exists
    const { data: existingVersion } = await supabase
      .from("app_versions")
      .select("id")
      .eq("version", version)
      .maybeSingle();

    if (existingVersion) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'الإصدار موجود مسبقاً',
          message: `الإصدار ${version} مسجل في قاعدة البيانات بالفعل`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get artifacts from the latest run - look for web-bundle artifact
    const artifactsResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/runs/${latestRun.id}/artifacts`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-App',
        },
      }
    );

    if (!artifactsResponse.ok) {
      const errorText = await artifactsResponse.text();
      console.error(`Failed to fetch artifacts: ${artifactsResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ success: false, error: 'فشل في جلب الملفات', details: errorText }),
        { status: artifactsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const artifactsData = await artifactsResponse.json();
    
    // Look for web-bundle artifact first, then fall back to any artifact
    let bundleArtifact: GitHubArtifact | null = artifactsData.artifacts?.find(
      (a: GitHubArtifact) => a.name.includes('web-bundle') || a.name.includes('dist')
    ) || null;

    // If no web-bundle, we need to generate bundle from published site
    if (!bundleArtifact) {
      console.log('No web-bundle artifact found, fetching from published site...');
      
      // Fetch version.json from the published site to get current version info
      const publishedUrl = Deno.env.get('PUBLISHED_URL') || 'https://hamza-wasl-platform.lovable.app';
      
      try {
        const versionResponse = await fetch(`${publishedUrl}/version.json`);
        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          console.log('Published version info:', versionData);
          
          // Use published version if no version specified
          if (!version && versionData.version) {
            version = versionData.version;
          }
        }
      } catch (e) {
        console.log('Could not fetch version.json, continuing with detected version');
      }

      // Create a bundle by downloading assets from the published site
      const assetsToFetch = [
        '/index.html',
        '/vite.svg',
        '/manifest.json',
      ];

      const zip = new JSZip();
      let fetchedCount = 0;

      // Fetch index.html to extract asset references
      const indexResponse = await fetch(`${publishedUrl}/index.html`);
      if (!indexResponse.ok) {
        throw new Error('Failed to fetch index.html from published site');
      }
      
      const indexHtml = await indexResponse.text();
      zip.file('index.html', indexHtml);
      fetchedCount++;

      // Extract JS and CSS file references from index.html
      const jsMatches = indexHtml.match(/src="\/assets\/[^"]+\.js"/g) || [];
      const cssMatches = indexHtml.match(/href="\/assets\/[^"]+\.css"/g) || [];
      
      const assetUrls = [
        ...jsMatches.map(m => m.match(/["']([^"']+)["']/)?.[1]).filter(Boolean),
        ...cssMatches.map(m => m.match(/["']([^"']+)["']/)?.[1]).filter(Boolean),
      ];

      console.log(`Found ${assetUrls.length} assets to download`);

      // Download each asset
      for (const assetUrl of assetUrls) {
        if (!assetUrl) continue;
        try {
          const assetResponse = await fetch(`${publishedUrl}${assetUrl}`);
          if (assetResponse.ok) {
            const content = await assetResponse.arrayBuffer();
            // Remove leading slash for zip path
            zip.file(assetUrl.startsWith('/') ? assetUrl.slice(1) : assetUrl, content);
            fetchedCount++;
          }
        } catch (e) {
          console.log(`Failed to fetch asset: ${assetUrl}`);
        }
      }

      // Also try to fetch common assets
      const commonAssets = [
        '/favicon.ico',
        '/robots.txt',
        '/icon-192.png',
        '/icon-512.png',
        '/apple-touch-icon.png',
      ];

      for (const asset of commonAssets) {
        try {
          const response = await fetch(`${publishedUrl}${asset}`);
          if (response.ok) {
            const content = await response.arrayBuffer();
            zip.file(asset.slice(1), content);
            fetchedCount++;
          }
        } catch {
          // Asset not found, skip
        }
      }

      console.log(`Fetched ${fetchedCount} files for bundle`);

      // Generate the zip
      const bundleContent = await zip.generateAsync({ type: 'uint8array' });
      
      // Upload to Supabase storage
      const bundleId = `bundle-${version}-${Date.now()}`;
      const filePath = `${bundleId}/bundle.zip`;
      
      const { error: uploadError } = await supabase.storage
        .from('app-updates')
        .upload(filePath, bundleContent, {
          contentType: 'application/zip',
          upsert: false,
        });

      if (uploadError) {
        console.error('Failed to upload bundle:', uploadError);
        throw new Error(`فشل في رفع الحزمة: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('app-updates')
        .getPublicUrl(filePath);

      // Create version record
      const { error: insertError } = await supabase.from("app_versions").insert({
        version: version,
        bundle_id: bundleId,
        bundle_url: publicUrl,
        min_app_version: minAppVersion,
        release_notes: releaseNotes || `تحديث تلقائي - بناء رقم ${latestRun.run_number}`,
        is_mandatory: isMandatory,
        is_active: true,
      });

      if (insertError) {
        // Clean up uploaded file
        await supabase.storage.from('app-updates').remove([filePath]);
        throw insertError;
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'تم إنشاء حزمة OTA بنجاح من الموقع المنشور',
          version: version,
          bundleId: bundleId,
          filesCount: fetchedCount,
          run: {
            id: latestRun.id,
            run_number: latestRun.run_number,
            created_at: latestRun.created_at,
            commit_message: commitMessage,
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we have a bundle artifact, download and re-upload to Supabase
    console.log(`Found artifact: ${bundleArtifact.name}, ID: ${bundleArtifact.id}`);

    // Download the artifact
    const downloadResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/artifacts/${bundleArtifact.id}/zip`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-App',
        },
      }
    );

    if (!downloadResponse.ok) {
      throw new Error('Failed to download artifact from GitHub');
    }

    const artifactContent = new Uint8Array(await downloadResponse.arrayBuffer());

    // Upload to Supabase storage
    const bundleId = `bundle-${version}-${Date.now()}`;
    const filePath = `${bundleId}/bundle.zip`;
    
    const { error: uploadError } = await supabase.storage
      .from('app-updates')
      .upload(filePath, artifactContent, {
        contentType: 'application/zip',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload bundle:', uploadError);
      throw new Error(`فشل في رفع الحزمة: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('app-updates')
      .getPublicUrl(filePath);

    // Create version record
    const { error: insertError } = await supabase.from("app_versions").insert({
      version: version,
      bundle_id: bundleId,
      bundle_url: publicUrl,
      min_app_version: minAppVersion,
      release_notes: releaseNotes || `تحديث تلقائي - بناء رقم ${latestRun.run_number}`,
      is_mandatory: isMandatory,
      is_active: true,
    });

    if (insertError) {
      // Clean up uploaded file
      await supabase.storage.from('app-updates').remove([filePath]);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'تم استيراد حزمة OTA بنجاح من GitHub',
        version: version,
        bundleId: bundleId,
        artifact: {
          id: bundleArtifact.id,
          name: bundleArtifact.name,
          size_in_bytes: bundleArtifact.size_in_bytes,
        },
        run: {
          id: latestRun.id,
          run_number: latestRun.run_number,
          created_at: latestRun.created_at,
          commit_message: commitMessage,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching GitHub OTA:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'حدث خطأ غير متوقع', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
