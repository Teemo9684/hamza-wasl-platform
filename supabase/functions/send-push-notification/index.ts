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

// FCM error codes that indicate the token should be removed
const INVALID_TOKEN_ERRORS = ['UNREGISTERED', 'INVALID_ARGUMENT', 'SENDER_ID_MISMATCH'];

// Send notification via FCM v1 API
async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string; errorCode?: string; token: string }> {
  try {
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
                channel_id: "default",
              },
            },
            data: data || {},
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      const errorCode = error?.error?.details?.[0]?.errorCode || '';
      console.error(`FCM error for token ${token.substring(0, 20)}...:`, error);
      return { success: false, error: JSON.stringify(error), errorCode, token };
    }
    return { success: true, token };
  } catch (err) {
    console.error(`Exception sending to token ${token.substring(0, 20)}...:`, err);
    return { success: false, error: String(err), token };
  }
}

// Remove invalid tokens from database
async function removeInvalidTokens(supabase: any, tokens: string[]) {
  if (tokens.length === 0) return;
  
  console.log(`Removing ${tokens.length} invalid tokens from database`);
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .in('token', tokens);
    
  if (error) {
    console.error('Error removing invalid tokens:', error);
  } else {
    console.log('Successfully removed invalid tokens');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

    console.log('Push notification request received');
    console.log('Firebase service account configured:', !!serviceAccountJson);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { user_ids, grade_level, title, body, data }: PushNotificationRequest = await req.json();

    console.log('Request params:', { user_ids_count: user_ids?.length, grade_level, title });

    // Get push tokens based on criteria
    let tokens: string[] = [];

    if (user_ids && user_ids.length > 0) {
      console.log('Fetching tokens for user_ids:', user_ids);
      const { data: tokenData, error } = await supabase
        .from('push_tokens')
        .select('token, user_id')
        .in('user_id', user_ids);

      if (error) {
        console.error('Error fetching tokens:', error);
        throw error;
      }
      console.log('Found tokens:', tokenData?.length || 0);
      tokens = tokenData?.map(t => t.token) || [];
    } else if (grade_level) {
      console.log('Fetching tokens for grade_level:', grade_level);
      const { data: studentParents, error: spError } = await supabase
        .from('students')
        .select(`parent_students (parent_id)`)
        .eq('grade_level', grade_level);

      if (spError) throw spError;

      const parentIds = studentParents
        ?.flatMap(s => s.parent_students?.map(ps => ps.parent_id) || [])
        .filter((id, index, self) => self.indexOf(id) === index) || [];

      console.log('Found parent IDs:', parentIds.length);

      if (parentIds.length > 0) {
        const { data: tokenData, error: tokenError } = await supabase
          .from('push_tokens')
          .select('token')
          .in('user_id', parentIds);

        if (tokenError) throw tokenError;
        tokens = tokenData?.map(t => t.token) || [];
      }
    } else {
      // No user_ids or grade_level specified - send to ALL users (for global announcements)
      console.log('No specific target - fetching ALL tokens for global notification');
      const { data: tokenData, error } = await supabase
        .from('push_tokens')
        .select('token');

      if (error) {
        console.error('Error fetching all tokens:', error);
        throw error;
      }
      console.log('Found all tokens:', tokenData?.length || 0);
      tokens = tokenData?.map(t => t.token) || [];
    }

    console.log('Total tokens to send:', tokens.length);

    if (tokens.length === 0) {
      console.log('No tokens found to send notifications');
      return new Response(
        JSON.stringify({ success: true, message: 'No tokens found to send notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications via FCM v1 API
    if (serviceAccountJson) {
      // Validate that the service account is valid JSON
      let serviceAccount: ServiceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
        
        // Validate required fields
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
          console.error('Invalid service account: missing required fields');
          console.error('Has project_id:', !!serviceAccount.project_id);
          console.error('Has private_key:', !!serviceAccount.private_key);
          console.error('Has client_email:', !!serviceAccount.client_email);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid Firebase service account configuration. Please ensure the complete JSON file is provided.',
              tokens_count: tokens.length 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (parseError) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON:', parseError);
        console.error('First 50 chars of value:', serviceAccountJson?.substring(0, 50));
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'FIREBASE_SERVICE_ACCOUNT is not valid JSON. Please provide the complete Firebase service account JSON file.',
            tokens_count: tokens.length 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Firebase project ID:', serviceAccount.project_id);
      
      const accessToken = await getAccessToken(serviceAccount);
      console.log('Got FCM access token');

      console.log(`Sending notifications to ${tokens.length} devices...`);

      const results = await Promise.allSettled(
        tokens.map(token => sendFCMNotification(accessToken, serviceAccount.project_id, token, title, body, data))
      );

      // Collect tokens to remove (invalid/unregistered)
      const tokensToRemove: string[] = [];
      
      const successCount = results.filter(r => {
        if (r.status === 'fulfilled') {
          const val = r.value as any;
          // Check if token should be removed
          if (!val.success && val.errorCode && INVALID_TOKEN_ERRORS.includes(val.errorCode)) {
            tokensToRemove.push(val.token);
          }
          return val.success;
        }
        return false;
      }).length;
      
      const failCount = tokens.length - successCount;

      console.log(`Sent ${successCount} notifications, ${failCount} failed`);

      // Log failed notifications for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Token ${index} failed:`, result.reason);
        } else if (!(result.value as any).success) {
          console.error(`Token ${index} FCM error:`, (result.value as any).error);
        }
      });

      // Remove invalid tokens in background
      if (tokensToRemove.length > 0) {
        console.log(`Found ${tokensToRemove.length} invalid tokens to remove`);
        await removeInvalidTokens(supabase, tokensToRemove);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: successCount, 
          failed: failCount,
          total_tokens: tokens.length,
          removed_tokens: tokensToRemove.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('FIREBASE_SERVICE_ACCOUNT not configured. Would send to tokens:', tokens.length);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'FCM not configured - FIREBASE_SERVICE_ACCOUNT secret not set',
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