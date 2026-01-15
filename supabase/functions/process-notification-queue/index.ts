import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing notification queue...');

    // Get unprocessed notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      console.log('No pending notifications to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending notifications', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${notifications.length} pending notifications`);

    let successCount = 0;
    let failCount = 0;

    for (const notification of notifications) {
      try {
        // Call the send-push-notification function
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
          body: notification.payload
        });

        if (error) {
          console.error(`Error sending notification ${notification.id}:`, error);
          failCount++;
        } else {
          console.log(`Notification ${notification.id} sent successfully:`, data);
          successCount++;
        }

        // Mark as processed regardless of success (to prevent infinite retries)
        const { error: updateError } = await supabase
          .from('notification_queue')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`Error marking notification ${notification.id} as processed:`, updateError);
        }
      } catch (err) {
        console.error(`Exception processing notification ${notification.id}:`, err);
        failCount++;

        // Still mark as processed to prevent infinite loop
        await supabase
          .from('notification_queue')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('id', notification.id);
      }
    }

    // Clean up old processed notifications (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { error: cleanupError } = await supabase
      .from('notification_queue')
      .delete()
      .eq('processed', true)
      .lt('processed_at', sevenDaysAgo.toISOString());

    if (cleanupError) {
      console.warn('Error cleaning up old notifications:', cleanupError);
    }

    console.log(`Processed ${successCount} notifications successfully, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: successCount,
        failed: failCount,
        total: notifications.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing notification queue:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
