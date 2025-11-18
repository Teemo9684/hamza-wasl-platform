import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `أنت مساعد متخصص في استخراج بيانات التلاميذ من الصور. مهمتك هي فحص الصورة المرفوعة واستخراج قائمة التلاميذ منها.
            
يجب أن تستخرج المعلومات التالية لكل تلميذ:
- الاسم الكامل (full_name)
- الرقم التعريفي الوطني (national_school_id) إن وُجد
- القسم/الفوج (class_section) إن وُجد

قم بإرجاع النتيجة بصيغة JSON فقط، بدون أي نص إضافي، في الشكل التالي:
{
  "students": [
    {
      "full_name": "اسم التلميذ",
      "national_school_id": "الرقم التعريفي",
      "class_section": "القسم"
    }
  ]
}

إذا لم تجد رقم تعريفي أو قسم، اتركه فارغاً أو استخدم null.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `استخرج بيانات التلاميذ من هذه الصورة. المستوى الدراسي المطلوب هو: ${gradeLevel || 'غير محدد'}`
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
        temperature: 0.2,
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
    
    return new Response(
      JSON.stringify({ students: studentsData.students }), 
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
