import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Setup admin: Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Setup admin: Invalid or expired token:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user making the request is already an admin
    const { data: callerRole, error: callerRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (callerRoleError) {
      console.error('Setup admin: Error checking caller role:', callerRoleError);
      return new Response(
        JSON.stringify({ error: 'Error verifying permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if any admin exists in the system
    const { data: existingAdmins, error: adminCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1);

    if (adminCheckError) {
      console.error('Setup admin: Error checking existing admins:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Error checking system state' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasExistingAdmin = existingAdmins && existingAdmins.length > 0;

    // If an admin exists and caller is not an admin, deny access
    if (hasExistingAdmin && !callerRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');
    const ADMIN_PIN = Deno.env.get('ADMIN_PASSWORD');

    if (!ADMIN_EMAIL || !ADMIN_PIN) {
      throw new Error('Admin credentials not configured');
    }

    // Check if the specific admin user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUser?.users?.some(u => u.email === ADMIN_EMAIL);

    if (adminExists) {
      return new Response(
        JSON.stringify({ message: 'حساب المسؤول موجود بالفعل' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PIN,
      email_confirm: true,
      user_metadata: {
        full_name: 'المسؤول',
      },
    });

    if (createError) throw createError;

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'admin',
      });

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({ 
        message: 'تم إنشاء حساب المسؤول بنجاح',
        email: ADMIN_EMAIL 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
    console.error('Setup admin error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
