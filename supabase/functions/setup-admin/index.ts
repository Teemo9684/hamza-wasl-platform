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

    // Get the JWT from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify the caller is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if the caller has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      // Allow first-time setup if no admins exist
      const { data: existingAdmins, error: adminCheckError } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (adminCheckError) {
        console.error('Error checking existing admins:', adminCheckError);
        return new Response(
          JSON.stringify({ error: 'فشل التحقق من صلاحيات المسؤول' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // If admins exist and caller is not admin, deny access
      if (existingAdmins && existingAdmins.length > 0) {
        return new Response(
          JSON.stringify({ error: 'هذه العملية متاحة للمسؤولين فقط' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    // Admin credentials from environment secrets
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD');

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'بيانات اعتماد المسؤول غير مُعدَّة في الأسرار' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if the admin user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = existingUser?.users?.find(u => u.email === ADMIN_EMAIL);

    if (adminUser) {
      // Update admin password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        adminUser.id,
        { password: ADMIN_PASSWORD }
      );

      if (updateError) {
        console.error('Error updating admin password:', updateError);
        throw new Error('فشل تحديث كلمة المرور');
      }

      // Ensure role exists
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: adminUser.id,
          role: 'admin',
        }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.error('Error ensuring admin role:', roleError);
      }

      return new Response(
        JSON.stringify({ message: 'تم تحديث حساب المسؤول بنجاح' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create new admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'المسؤول',
      },
    });

    if (createError) throw createError;

    // Assign admin role
    const { error: newRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'admin',
      });

    if (newRoleError) throw newRoleError;

    return new Response(
      JSON.stringify({ 
        message: 'تم إنشاء حساب المسؤول بنجاح',
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
