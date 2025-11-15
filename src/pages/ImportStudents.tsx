import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface StudentRow {
  full_name: string;
  national_school_id: string;
  class_section: string;
  date_of_birth?: string;
}

const ImportStudents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف Excel (.xlsx أو .xls)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setResults(null);

    try {
      // قراءة الملف
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as StudentRow[];

      if (jsonData.length === 0) {
        toast({
          title: "خطأ",
          description: "الملف فارغ أو بصيغة غير صحيحة",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // معالجة كل صف
      for (const row of jsonData) {
        try {
          // التحقق من البيانات المطلوبة
          if (!row.full_name || !row.national_school_id || !row.class_section) {
            errors.push(`صف مفقود البيانات: ${JSON.stringify(row)}`);
            failedCount++;
            continue;
          }

          // إدخال التلميذ في قاعدة البيانات
          const { error } = await supabase
            .from('students')
            .insert({
              full_name: row.full_name,
              national_school_id: row.national_school_id,
              grade_level: "ابتدائي", // قيمة افتراضية للمدرسة الابتدائية
              class_section: row.class_section,
              date_of_birth: row.date_of_birth || null,
            });

          if (error) {
            errors.push(`فشل إضافة ${row.full_name}: ${error.message}`);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (err: any) {
          errors.push(`خطأ في معالجة ${row.full_name}: ${err.message}`);
          failedCount++;
        }
      }

      setResults({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10), // عرض أول 10 أخطاء فقط
      });

      if (successCount > 0) {
        toast({
          title: "تم بنجاح",
          description: `تمت إضافة ${successCount} تلميذ بنجاح`,
        });
      }

      if (failedCount > 0) {
        toast({
          title: "تحذير",
          description: `فشل إضافة ${failedCount} تلميذ`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء معالجة الملف",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // إعادة تعيين الملف المدخل
      event.target.value = "";
    }
  };

  const downloadTemplate = () => {
    // إنشاء ملف Excel نموذجي
    const template = [
      {
        full_name: "أحمد محمد",
        national_school_id: "2024001",
        class_section: "السنة الأولى - أ",
        date_of_birth: "2010-01-15",
      },
      {
        full_name: "فاطمة علي",
        national_school_id: "2024002",
        class_section: "السنة الثانية - ب",
        date_of_birth: "2009-05-20",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "التلاميذ");
    
    // تنزيل الملف
    XLSX.writeFile(workbook, "نموذج_قائمة_التلاميذ.xlsx");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 animated-bg opacity-10" />
      
      <div className="relative z-10">
        <header className="glass-card border-b">
          <div className="container mx-auto px-4 py-4">
            <Button
              onClick={() => navigate("/dashboard/admin")}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة إلى لوحة التحكم
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">استيراد قائمة التلاميذ</h1>
            <p className="text-muted-foreground">
              قم بتحميل ملف Excel يحتوي على معلومات التلاميذ لإضافتهم بشكل جماعي
            </p>
          </div>

          <div className="grid gap-6">
            {/* بطاقة التعليمات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  تعليمات الاستخدام
                </CardTitle>
                <CardDescription>
                  اتبع الخطوات التالية لاستيراد قائمة التلاميذ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">الأعمدة المطلوبة:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mr-4">
                    <li><strong>full_name</strong>: الاسم الكامل للتلميذ (مطلوب)</li>
                    <li><strong>national_school_id</strong>: الرقم الوطني المدرسي (مطلوب)</li>
                    <li><strong>class_section</strong>: القسم (مثال: السنة الأولى - أ) (مطلوب)</li>
                    <li><strong>date_of_birth</strong>: تاريخ الميلاد بصيغة YYYY-MM-DD (اختياري)</li>
                  </ul>
                </div>

                <Button onClick={downloadTemplate} variant="outline" className="w-full">
                  <FileSpreadsheet className="ml-2 h-4 w-4" />
                  تحميل ملف النموذج
                </Button>
              </CardContent>
            </Card>

            {/* بطاقة الرفع */}
            <Card>
              <CardHeader>
                <CardTitle>رفع ملف Excel</CardTitle>
                <CardDescription>
                  اختر ملف Excel يحتوي على قائمة التلاميذ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">انقر لاختيار ملف</span> أو اسحب الملف هنا
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Excel (.xlsx, .xls)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {uploading && (
                  <div className="mt-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">جاري معالجة الملف...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* بطاقة النتائج */}
            {results && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {results.failed === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    نتائج الاستيراد
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-muted-foreground">تم بنجاح</p>
                      <p className="text-2xl font-bold text-green-500">{results.success}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-muted-foreground">فشل</p>
                      <p className="text-2xl font-bold text-red-500">{results.failed}</p>
                    </div>
                  </div>

                  {results.errors.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">الأخطاء:</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {results.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-500">
                            • {error}
                          </p>
                        ))}
                        {results.errors.length === 10 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ... وأخطاء أخرى
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ImportStudents;
