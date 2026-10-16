import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

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
    // Verify Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase admin client with service role for verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user using token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Check user role using service role client
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'teacher'])
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Access denied. Admin or teacher role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User role verified:', roleData.role);

    const { imageBase64, gradeLevel } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }), 
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

    console.log('Calling Lovable AI to extract student data from image...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `أنت خبير في قراءة واستخراج بيانات التلاميذ من قوائم المدارس الجزائرية. مهمتك هي فحص الصورة المرفوعة واستخراج قائمة التلاميذ منها بدقة عالية.

**مهم جداً**: اقرأ الأسماء العربية بشكل صحيح وكامل. الأسماء تُكتب من اليمين إلى اليسار.

يجب أن تستخرج المعلومات التالية لكل تلميذ:
1. **الاسم الكامل (full_name)**: اللقب ثم الاسم. مثال: "بوعزة محمد أمين"
2. **رقم التعريف الوطني (national_school_id)**: رقم مكون من 13-16 رقماً
3. **تاريخ الميلاد (date_of_birth)**: بصيغة YYYY-MM-DD
4. **القسم/الفوج (class_section)**: رقم أو اسم القسم من عنوان الوثيقة

**تعليمات مهمة**:
- اقرأ كل اسم بدقة حرفاً حرفاً
- تاريخ الميلاد: إذا كان بصيغة "10-04-2015" أو "10/04/2015" يعني 10 أبريل 2015، حوّله إلى "2015-04-10"
- استخرج رقم/اسم القسم من عنوان الصفحة (مثل: "السنة الخامسة 01" أو "الفوج أ")

**صيغة الإخراج**: JSON فقط بدون أي نص إضافي:
{
  "students": [
    {
      "full_name": "اللقب الاسم",
      "national_school_id": "الرقم أو null",
      "date_of_birth": "YYYY-MM-DD أو null",
      "class_section": "رقم القسم أو null"
    }
  ],
  "detected_class": "اسم المستوى والقسم المستخرج"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `استخرج جميع بيانات التلاميذ من هذه الصورة بدقة. المستوى الدراسي: ${gradeLevel || 'غير محدد'}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.1,
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
        JSON.stringify({ error: 'فشل في معالجة الصورة' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'لم يتم استخراج أي بيانات من الصورة' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Response length:', content.length);

    // Parse the JSON response - handle markdown code blocks
    let studentsData;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      cleanContent = cleanContent.replace(/```json\s*/gi, '');
      cleanContent = cleanContent.replace(/```\s*/g, '');
      cleanContent = cleanContent.trim();
      
      // Try to extract the JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        // Fix incomplete JSON
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/\]/g) || []).length;
        
        if (openBrackets > closeBrackets) {
          jsonStr += ']'.repeat(openBrackets - closeBrackets);
        }
        if (openBraces > closeBraces) {
          jsonStr += '}'.repeat(openBraces - closeBraces);
        }
        
        // Remove trailing commas
        jsonStr = jsonStr.replace(/,\s*\]/g, ']');
        jsonStr = jsonStr.replace(/,\s*\}/g, '}');
        
        studentsData = JSON.parse(jsonStr);
      } else {
        studentsData = JSON.parse(cleanContent);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Content preview:', content.substring(0, 500));
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
    console.error('Error in extract-students-from-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
