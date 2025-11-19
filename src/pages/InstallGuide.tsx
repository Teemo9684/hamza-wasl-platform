import { useEffect, useState } from "react";
import { Smartphone, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const InstallGuide = () => {
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    // Get the current app URL
    setAppUrl(window.location.origin);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'همزة وصل - مدرسة العربي التبسي',
          text: 'حمّل تطبيق همزة وصل للتواصل مع المدرسة',
          url: appUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-accent p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 font-ruqaa">همزة وصل</h1>
          <p className="text-2xl text-white/90 font-cairo">مدرسة العربي التبسي</p>
          <p className="text-xl text-white/80 font-cairo mt-2">جسر التواصل بين المدرسة والبيت</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 print:shadow-none">
          {/* QR Code Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-6 font-cairo">
              امسح الرمز لتحميل التطبيق
            </h2>
            
            <div className="bg-white p-8 rounded-2xl inline-block border-4 border-primary/20 mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl)}`}
                alt="QR Code"
                className="w-64 h-64 mx-auto"
              />
            </div>

            <div className="text-sm text-muted-foreground font-cairo mb-4">
              أو استخدم الرابط المباشر:
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm font-mono break-all">
              {appUrl}
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Android */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
                <h3 className="text-2xl font-bold text-primary font-cairo">أندرويد</h3>
              </div>
              <ol className="space-y-3 text-right font-cairo text-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">١.</span>
                  <span>افتح الرابط في متصفح Chrome</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">٢.</span>
                  <span>اضغط على القائمة (⋮)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">٣.</span>
                  <span>اختر "إضافة إلى الشاشة الرئيسية"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">٤.</span>
                  <span>اضغط "إضافة"</span>
                </li>
              </ol>
            </div>

            {/* iPhone */}
            <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="w-8 h-8 text-secondary" />
                <h3 className="text-2xl font-bold text-secondary font-cairo">آيفون</h3>
              </div>
              <ol className="space-y-3 text-right font-cairo text-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-secondary">١.</span>
                  <span>افتح الرابط في متصفح Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-secondary">٢.</span>
                  <span>اضغط زر المشاركة (📤)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-secondary">٣.</span>
                  <span>اختر "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-secondary">٤.</span>
                  <span>اضغط "إضافة"</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Registration Steps */}
          <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-accent mb-4 font-cairo">خطوات التسجيل</h3>
            <ol className="space-y-3 text-right font-cairo text-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-accent">١.</span>
                <span>افتح التطبيق من الشاشة الرئيسية</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-accent">٢.</span>
                <span>اختر "تسجيل ولي أمر"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-accent">٣.</span>
                <span>أدخل بياناتك والرقم الوطني للتلميذ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-accent">٤.</span>
                <span>انتظر موافقة الإدارة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-accent">٥.</span>
                <span>ابدأ التواصل مع الأساتذة</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons - Hidden in print */}
          <div className="flex gap-4 justify-center print:hidden">
            <Button
              onClick={handlePrint}
              variant="default"
              size="lg"
              className="gap-2"
            >
              <Download className="w-5 h-5" />
              طباعة الورقة
            </Button>
            
            {navigator.share && (
              <Button
                onClick={handleShare}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Share2 className="w-5 h-5" />
                مشاركة الرابط
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/70 font-cairo print:hidden">
          <p>© مدرسة العربي التبسي 2026</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InstallGuide;