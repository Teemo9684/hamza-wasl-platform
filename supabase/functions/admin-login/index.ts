import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL');
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD');

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error('Admin credentials not configured');
    }

    // التحقق من كلمة المرور
    if (password !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // إرجاع البريد الإلكتروني للمسؤول
    return new Response(
      JSON.stringify({ success: true, email: ADMIN_EMAIL }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
    console.error('Admin login error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
