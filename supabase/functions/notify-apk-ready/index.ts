import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  email: string;
  downloadUrl: string;
  buildNumber: string;
  commitMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, downloadUrl, buildNumber, commitMessage }: NotifyRequest = await req.json();

    if (!email || !downloadUrl) {
      return new Response(
        JSON.stringify({ error: "email and downloadUrl are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "APK Builder <onboarding@resend.dev>",
      to: [email],
      subject: `✅ تطبيق APK جاهز للتحميل - البناء #${buildNumber}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 20px;
              direction: rtl;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 16px;
            }
            h1 {
              color: #1a1a1a;
              margin: 0;
              font-size: 24px;
            }
            .success-badge {
              display: inline-block;
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              margin-top: 12px;
            }
            .info-box {
              background: #f8fafc;
              border-radius: 12px;
              padding: 20px;
              margin: 24px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              color: #64748b;
              font-size: 14px;
            }
            .info-value {
              color: #1e293b;
              font-weight: 600;
              font-size: 14px;
            }
            .download-btn {
              display: block;
              background: linear-gradient(135deg, #3b82f6, #2563eb);
              color: white !important;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin: 24px 0;
              transition: transform 0.2s;
            }
            .download-btn:hover {
              transform: scale(1.02);
            }
            .note {
              background: #fef3c7;
              border-radius: 8px;
              padding: 12px;
              font-size: 13px;
              color: #92400e;
              text-align: center;
            }
            .footer {
              text-align: center;
              color: #94a3b8;
              font-size: 12px;
              margin-top: 24px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">📱</div>
              <h1>تطبيقك جاهز!</h1>
              <span class="success-badge">✓ تم البناء بنجاح</span>
            </div>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">رقم البناء</span>
                <span class="info-value">#${buildNumber}</span>
              </div>
              ${commitMessage ? `
              <div class="info-row">
                <span class="info-label">آخر تحديث</span>
                <span class="info-value">${commitMessage}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">الوقت</span>
                <span class="info-value">${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}</span>
              </div>
            </div>
            
            <a href="${downloadUrl}" class="download-btn">
              ⬇️ تحميل APK
            </a>
            
            <div class="note">
              ⚠️ الرابط صالح لمدة 30 يوماً فقط
            </div>
            
            <div class="footer">
              تم الإرسال تلقائياً من نظام بناء التطبيق
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("APK notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending APK notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
