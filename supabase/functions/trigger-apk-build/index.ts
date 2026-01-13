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

    // Parse request body to get version
    let version = '1.0.0';
    try {
      const body = await req.json();
      if (body.version) {
        version = body.version;
      }
    } catch {
      // If no body, use default version
    }

    console.log(`Triggering APK build for repository: ${githubRepo} with version: ${version}`);

    // Trigger GitHub Actions workflow with version input
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/build-android.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Lovable-App',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            app_version: version,
          },
        }),
      }
    );

    if (response.status === 204) {
      console.log('APK build triggered successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'تم تشغيل بناء التطبيق بنجاح! سيتم إرسال إشعار عند الانتهاء.' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const errorText = await response.text();
      console.error(`GitHub API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'فشل في تشغيل البناء', 
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error triggering APK build:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ غير متوقع', details: errorMessage }),
      {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
