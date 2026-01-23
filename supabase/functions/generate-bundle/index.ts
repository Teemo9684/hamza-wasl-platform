import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VersionInfo {
  version: string;
  buildTime: string;
  mandatory?: boolean;
  minVersion?: string;
  releaseNotes?: string;
}

// Parse HTML to extract asset URLs
function extractAssets(html: string, baseUrl: string): { scripts: string[], styles: string[], assets: string[] } {
  const scripts: string[] = [];
  const styles: string[] = [];
  const assets: string[] = [];

  // Extract script src
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src.startsWith('http') || src.startsWith(baseUrl)) {
      scripts.push(src.startsWith('/') ? src : `/${src}`);
    }
  }

  // Extract link href (CSS)
  const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.endsWith('.css') && (!href.startsWith('http') || href.startsWith(baseUrl))) {
      styles.push(href.startsWith('/') ? href : `/${href}`);
    }
  }

  // Extract preload/modulepreload links
  const preloadRegex = /<link[^>]+rel=["'](?:preload|modulepreload)["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
  while ((match = preloadRegex.exec(html)) !== null) {
    const href = match[1];
    if (!href.startsWith('http') || href.startsWith(baseUrl)) {
      const path = href.startsWith('/') ? href : `/${href}`;
      if (!scripts.includes(path) && !styles.includes(path)) {
        if (href.endsWith('.js')) {
          scripts.push(path);
        } else if (href.endsWith('.css')) {
          styles.push(path);
        }
      }
    }
  }

  return { scripts, styles, assets };
}

// Extract additional assets from JS/CSS content
function extractAdditionalAssets(content: string): string[] {
  const assets: string[] = [];
  
  // Find asset references in JS (common patterns)
  const assetPatterns = [
    /["']\/assets\/[^"']+["']/g,
    /["']\/images\/[^"']+["']/g,
    /["']\/fonts\/[^"']+["']/g,
  ];

  for (const pattern of assetPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const asset = match[0].replace(/["']/g, '');
      if (!assets.includes(asset)) {
        assets.push(asset);
      }
    }
  }

  return assets;
}

async function fetchFile(url: string): Promise<{ content: Uint8Array; contentType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    const content = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    return { content, contentType };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const publishedUrl = 'https://hamza-wasl-platform.lovable.app';
    
    console.log('Starting bundle generation from:', publishedUrl);

    // Step 1: Fetch version.json to get version info
    const versionResponse = await fetch(`${publishedUrl}/version.json?t=${Date.now()}`);
    if (!versionResponse.ok) {
      throw new Error('Failed to fetch version.json from published site');
    }
    const versionInfo: VersionInfo = await versionResponse.json();
    console.log('Version info:', versionInfo);

    // Step 2: Check if bundle already exists for this version
    const { data: existingVersion } = await supabase
      .from('app_versions')
      .select('*')
      .eq('version', versionInfo.version)
      .single();

    if (existingVersion?.bundle_url) {
      console.log('Bundle already exists for version:', versionInfo.version);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'البندل موجود مسبقاً لهذا الإصدار',
          version: versionInfo.version,
          bundle_url: existingVersion.bundle_url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Fetch index.html
    const indexResponse = await fetch(`${publishedUrl}/index.html?t=${Date.now()}`);
    if (!indexResponse.ok) {
      throw new Error('Failed to fetch index.html');
    }
    const indexHtml = await indexResponse.text();
    console.log('Fetched index.html, length:', indexHtml.length);

    // Step 4: Extract asset references
    const { scripts, styles } = extractAssets(indexHtml, publishedUrl);
    console.log('Found scripts:', scripts);
    console.log('Found styles:', styles);

    // Step 5: Create ZIP bundle
    const zip = new JSZip();
    
    // Add index.html
    zip.addFile('index.html', new TextEncoder().encode(indexHtml));

    // Track all assets to fetch
    const allAssets = new Set<string>();
    scripts.forEach(s => allAssets.add(s));
    styles.forEach(s => allAssets.add(s));

    // Fetch scripts and extract additional asset references
    for (const script of scripts) {
      const file = await fetchFile(`${publishedUrl}${script}`);
      if (file) {
        const path = script.startsWith('/') ? script.slice(1) : script;
        zip.addFile(path, file.content);
        
        // Extract additional assets from JS content
        const jsContent = new TextDecoder().decode(file.content);
        const additionalAssets = extractAdditionalAssets(jsContent);
        additionalAssets.forEach(a => allAssets.add(a));
      }
    }

    // Fetch stylesheets
    for (const style of styles) {
      const file = await fetchFile(`${publishedUrl}${style}`);
      if (file) {
        const path = style.startsWith('/') ? style.slice(1) : style;
        zip.addFile(path, file.content);
        
        // Extract additional assets from CSS content
        const cssContent = new TextDecoder().decode(file.content);
        const additionalAssets = extractAdditionalAssets(cssContent);
        additionalAssets.forEach(a => allAssets.add(a));
      }
    }

    // Fetch additional assets (images, fonts, etc.)
    for (const asset of allAssets) {
      if (!scripts.includes(asset) && !styles.includes(asset)) {
        const file = await fetchFile(`${publishedUrl}${asset}`);
        if (file) {
          const path = asset.startsWith('/') ? asset.slice(1) : asset;
          zip.addFile(path, file.content);
        }
      }
    }

    // Also try to fetch common assets
    const commonAssets = [
      '/favicon.ico',
      '/manifest.webmanifest',
      '/robots.txt',
    ];

    for (const asset of commonAssets) {
      if (!allAssets.has(asset)) {
        const file = await fetchFile(`${publishedUrl}${asset}`);
        if (file) {
          const path = asset.startsWith('/') ? asset.slice(1) : asset;
          zip.addFile(path, file.content);
        }
      }
    }

    // Step 6: Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'uint8array' });
    console.log('Generated ZIP size:', zipBlob.length, 'bytes');

    // Step 7: Upload to Supabase Storage
    const fileName = `bundle-${versionInfo.version}-${Date.now()}.zip`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('app-updates')
      .upload(fileName, zipBlob, {
        contentType: 'application/zip',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload bundle: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('app-updates')
      .getPublicUrl(fileName);

    const bundleUrl = urlData.publicUrl;
    console.log('Bundle uploaded to:', bundleUrl);

    // Step 8: Update or insert app_versions record
    if (existingVersion) {
      const { error: updateError } = await supabase
        .from('app_versions')
        .update({
          bundle_url: bundleUrl,
          is_active: true,
          release_notes: versionInfo.releaseNotes || existingVersion.release_notes,
          is_mandatory: versionInfo.mandatory ?? existingVersion.is_mandatory,
          min_supported_version: versionInfo.minVersion || existingVersion.min_supported_version,
        })
        .eq('id', existingVersion.id);

      if (updateError) {
        throw new Error(`Failed to update version record: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await supabase
        .from('app_versions')
        .insert({
          version: versionInfo.version,
          bundle_url: bundleUrl,
          is_active: true,
          release_notes: versionInfo.releaseNotes || '',
          is_mandatory: versionInfo.mandatory ?? false,
          min_supported_version: versionInfo.minVersion || '1.0.0',
        });

      if (insertError) {
        throw new Error(`Failed to insert version record: ${insertError.message}`);
      }
    }

    console.log('Bundle generation completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم توليد ورفع البندل بنجاح!',
        version: versionInfo.version,
        bundle_url: bundleUrl,
        bundle_size: zipBlob.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating bundle:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'فشل في توليد البندل', 
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
