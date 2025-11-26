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

    // Fixed admin credentials
    const ADMIN_EMAIL = "admin@arbit.local";
    const ADMIN_PASSWORD = "ARBIT1922@";

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
