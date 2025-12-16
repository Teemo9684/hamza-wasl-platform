import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { password } = await req.json();

    // Validate input
    if (!password || typeof password !== 'string') {
      console.error('Admin login attempt with missing or invalid password');
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get admin credentials from environment
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    const adminEmail = Deno.env.get('ADMIN_EMAIL');

    if (!adminPassword || !adminEmail) {
      console.error('Admin credentials not configured in environment');
      return new Response(
        JSON.stringify({ error: 'Admin credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    if (password !== adminPassword) {
      console.warn('Admin login failed: incorrect password');
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin user exists in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check if admin user exists and has admin role
    const { data: adminUser, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error checking admin user:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingAdmin = adminUser.users.find(u => u.email === adminEmail);
    
    if (!existingAdmin) {
      console.error('Admin user not found in auth.users');
      return new Response(
        JSON.stringify({ error: 'Admin account not found. Please run setup first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', existingAdmin.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Admin role not found for user:', existingAdmin.id);
      return new Response(
        JSON.stringify({ error: 'Admin privileges not configured' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin login successful for:', adminEmail);

    // Return admin email for client-side login
    return new Response(
      JSON.stringify({ email: adminEmail, success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-login function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
