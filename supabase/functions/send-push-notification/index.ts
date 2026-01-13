import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_ids?: string[];
  grade_level?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// Convert PEM private key to CryptoKey for JWT signing
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

// Get OAuth 2.0 access token using service account
async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const privateKey = await importPrivateKey(serviceAccount.private_key);
  
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(3600),
    },
    privateKey
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// Send notification via FCM v1 API
async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              default_vibrate_timings: true,
              default_light_settings: true,
            },
          },
          data: data || {},
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error(`FCM error for token ${token.substring(0, 20)}...:`, error);
    return { success: false, error: JSON.stringify(error) };
  }
  return { success: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { user_ids, grade_level, title, body, data }: PushNotificationRequest = await req.json();

    // Get push tokens based on criteria
    let tokens: string[] = [];

    if (user_ids && user_ids.length > 0) {
      const { data: tokenData, error } = await supabase
        .from('push_tokens')
        .select('token')
        .in('user_id', user_ids);

      if (error) throw error;
      tokens = tokenData?.map(t => t.token) || [];
    } else if (grade_level) {
      const { data: studentParents, error: spError } = await supabase
        .from('students')
        .select(`parent_students (parent_id)`)
        .eq('grade_level', grade_level);

      if (spError) throw spError;

      const parentIds = studentParents
        ?.flatMap(s => s.parent_students?.map(ps => ps.parent_id) || [])
        .filter((id, index, self) => self.indexOf(id) === index) || [];

      if (parentIds.length > 0) {
        const { data: tokenData, error: tokenError } = await supabase
          .from('push_tokens')
          .select('token')
          .in('user_id', parentIds);

        if (tokenError) throw tokenError;
        tokens = tokenData?.map(t => t.token) || [];
      }
    }

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No tokens found to send notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications via FCM v1 API
    if (serviceAccountJson) {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
      const accessToken = await getAccessToken(serviceAccount);

      console.log(`Sending notifications to ${tokens.length} devices...`);

      const results = await Promise.allSettled(
        tokens.map(token => sendFCMNotification(accessToken, serviceAccount.project_id, token, title, body, data))
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
      const failCount = tokens.length - successCount;

      console.log(`Sent ${successCount} notifications, ${failCount} failed`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: successCount, 
          failed: failCount,
          total_tokens: tokens.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('FIREBASE_SERVICE_ACCOUNT not configured. Would send to tokens:', tokens.length);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'FCM not configured - notifications logged only',
          tokens_count: tokens.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error sending push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});