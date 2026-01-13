import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_ids?: string[];        // Send to specific users
  grade_level?: string;       // Send to all parents of students in this grade
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_ids, grade_level, title, body, data }: PushNotificationRequest = await req.json();

    // Get push tokens based on criteria
    let tokens: string[] = [];

    if (user_ids && user_ids.length > 0) {
      // Get tokens for specific users
      const { data: tokenData, error } = await supabase
        .from('push_tokens')
        .select('token')
        .in('user_id', user_ids);

      if (error) throw error;
      tokens = tokenData?.map(t => t.token) || [];
    } else if (grade_level) {
      // Get tokens for parents of students in specific grade
      const { data: studentParents, error: spError } = await supabase
        .from('students')
        .select(`
          parent_students (
            parent_id
          )
        `)
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

    // Send notifications via FCM
    if (fcmServerKey) {
      const results = await Promise.allSettled(
        tokens.map(token =>
          fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${fcmServerKey}`,
            },
            body: JSON.stringify({
              to: token,
              notification: {
                title,
                body,
                sound: 'default',
                badge: 1,
              },
              data: data || {},
              priority: 'high',
            }),
          })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

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
      // FCM key not configured - log for debugging
      console.log('FCM_SERVER_KEY not configured. Would send to tokens:', tokens.length);
      
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