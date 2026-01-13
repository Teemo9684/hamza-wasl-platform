import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    const githubRepo = Deno.env.get('GITHUB_REPO');

    if (!githubToken || !githubRepo) {
      console.error('Missing GITHUB_TOKEN or GITHUB_REPO environment variables');
      return new Response(
        JSON.stringify({ error: 'GitHub configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching latest APK for repository: ${githubRepo}`);

    // First, let's check all workflow runs (not just successful ones) to debug
    const allRunsResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/build-android.yml/runs?per_page=5`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-App',
        },
      }
    );

    if (allRunsResponse.ok) {
      const allRunsData = await allRunsResponse.json();
      console.log(`All workflow runs count: ${allRunsData.workflow_runs?.length || 0}`);
      if (allRunsData.workflow_runs?.length > 0) {
        const latestRun = allRunsData.workflow_runs[0];
        console.log(`Latest run status: ${latestRun.status}, conclusion: ${latestRun.conclusion}, id: ${latestRun.id}`);
      }
    }

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
        JSON.stringify({ error: 'فشل في جلب بيانات البناء', details: errorText }),
        { 
          status: runsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const runsData = await runsResponse.json();
    
    if (!runsData.workflow_runs || runsData.workflow_runs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          available: false,
          error: 'لا يوجد بناء متاح',
          message: 'لم يتم العثور على أي بناء ناجح. قم ببناء التطبيق أولاً.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const latestRun = runsData.workflow_runs[0];
    console.log(`Latest successful run ID: ${latestRun.id}`);

    // Get artifacts from the latest run
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
        JSON.stringify({ error: 'فشل في جلب الملفات', details: errorText }),
        { 
          status: artifactsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const artifactsData = await artifactsResponse.json();
    
    if (!artifactsData.artifacts || artifactsData.artifacts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          available: false,
          error: 'لا يوجد ملف APK',
          message: 'لم يتم العثور على ملف APK في آخر بناء.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find the APK artifact
    const apkArtifact = artifactsData.artifacts.find(
      (a: { name: string }) => a.name.includes('app-debug') || a.name.includes('apk')
    ) || artifactsData.artifacts[0];

    console.log(`Found artifact: ${apkArtifact.name}, ID: ${apkArtifact.id}`);

    // Get the download URL (this returns a short-lived URL)
    const downloadResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/artifacts/${apkArtifact.id}/zip`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-App',
        },
        redirect: 'manual',
      }
    );

    // GitHub returns a 302 redirect to the actual download URL
    const downloadUrl = downloadResponse.headers.get('location');

    if (!downloadUrl) {
      console.error('No download URL returned from GitHub');
      return new Response(
        JSON.stringify({ error: 'فشل في الحصول على رابط التحميل' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        downloadUrl,
        artifact: {
          id: apkArtifact.id,
          name: apkArtifact.name,
          size_in_bytes: apkArtifact.size_in_bytes,
          created_at: apkArtifact.created_at,
          expires_at: apkArtifact.expires_at,
        },
        run: {
          id: latestRun.id,
          run_number: latestRun.run_number,
          created_at: latestRun.created_at,
          head_commit: latestRun.head_commit?.message || 'N/A',
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching APK download:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ غير متوقع', details: errorMessage }),
      {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
