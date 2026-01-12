import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client to verify user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify user is authenticated and has admin or teacher role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'teacher'])
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin or teacher role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { pdfText, gradeLevel } = await req.json();
    
    if (!pdfText) {
      return new Response(
        JSON.stringify({ error: 'PDF text content is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Lovable AI to extract student data from PDF text...');
    console.log('PDF text length:', pdfText.length);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `أنت مساعد متخصص في استخراج بيانات التلاميذ من قوائم المدارس الجزائرية. مهمتك هي تحليل النص المستخرج من ملف PDF واستخراج قائمة التلاميذ منه بدقة.
            
يجب أن تستخرج المعلومات التالية لكل تلميذ:
- الاسم الكامل (full_name): يتكون من اللقب ثم الاسم. مثال: "مرداسي حلا جيهان" حيث "مرداسي" هو اللقب و"حلا جيهان" هو الاسم
- رقم التعريف الوطني (national_school_id): رقم طويل مكون من 13 رقماً مثل "1101540010191100"
- تاريخ الميلاد (date_of_birth): بصيغة YYYY-MM-DD. مثال: إذا كان التاريخ "10-04-2015" يصبح "2015-04-10"
- القسم/الفوج (class_section): اسم القسم إن وجد في عنوان الوثيقة (مثل "01" أو "أ")

ملاحظات مهمة:
1. الاسم الكامل = اللقب + الاسم (بهذا الترتيب)
2. رقم التعريف الوطني يكون في عمود "رقم التعريف" وهو رقم طويل مكون من 13 رقم
3. تاريخ الميلاد يأتي بصيغ مختلفة مثل "يوم-شهر-سنة" أو "يوم/شهر/سنة"، قم بتحويله إلى YYYY-MM-DD
4. استخرج اسم القسم من عنوان الوثيقة (مثل "خامسة ابتدائي 01" أو "السنة الرابعة أ")
5. في حالة عدم وجود رقم التعريف، يمكن تركه فارغاً
6. ابحث عن الأنماط المتكررة في النص لتحديد بيانات كل تلميذ

قم بإرجاع النتيجة بصيغة JSON فقط، بدون أي نص إضافي، في الشكل التالي:
{
  "students": [
    {
      "full_name": "اللقب الاسم",
      "national_school_id": "رقم التعريف المكون من 13 رقم أو null",
      "date_of_birth": "YYYY-MM-DD أو null",
      "class_section": "رقم أو اسم القسم أو null"
    }
  ],
  "detected_class": "اسم المستوى والقسم المستخرج من العنوان"
}

إذا لم تجد معلومة معينة، استخدم null.`
          },
          {
            role: 'user',
            content: `استخرج بيانات التلاميذ من النص التالي المستخرج من ملف PDF. المستوى الدراسي المطلوب هو: ${gradeLevel || 'غير محدد'}

النص المستخرج من PDF:
${pdfText}`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'يجب إضافة رصيد للخدمة. يرجى التواصل مع الإدارة.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'فشل في معالجة البيانات' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'لم يتم استخراج أي بيانات من الملف' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Response:', content);

    // Parse the JSON response
    let studentsData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        studentsData = JSON.parse(jsonMatch[0]);
      } else {
        studentsData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'فشل في تحليل البيانات المستخرجة' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!studentsData.students || !Array.isArray(studentsData.students)) {
      console.error('Invalid students data structure');
      return new Response(
        JSON.stringify({ error: 'البيانات المستخرجة غير صحيحة' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully extracted ${studentsData.students.length} students`);
    console.log('Detected class:', studentsData.detected_class);
    
    return new Response(
      JSON.stringify({ 
        students: studentsData.students,
        detected_class: studentsData.detected_class || null
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-students-from-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
