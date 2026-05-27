import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowUp, GraduationCap, Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

// خريطة الترقية: من المستوى الحالي إلى المستوى التالي
// null يعني تخرج (يُحذف التلميذ)
const PROMOTION_MAP: Record<string, string | null> = {
  "تحضيري": "السنة الأولى ابتدائي",
  "سنة أولى": "السنة الثانية ابتدائي",
  "السنة الأولى ابتدائي": "السنة الثانية ابتدائي",
  "السنة الثانية ابتدائي": "السنة الثالثة ابتدائي",
  "السنة الثالثة ابتدائي": "السنة الرابعة ابتدائي",
  "السنة الرابعة ابتدائي": "السنة الخامسة ابتدائي",
  "السنة الخامسة ابتدائي": null, // تخرج إلى التعليم المتوسط
};

interface GradeCount {
  grade_level: string;
  count: number;
}

export const GradePromotionManager = () => {
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [grades, setGrades] = useState<GradeCount[]>([]);

  const fetchGrades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("grade_level");

    if (error) {
      toast.error("فشل في جلب بيانات التلاميذ");
      setLoading(false);
      return;
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((s: any) => {
      counts[s.grade_level] = (counts[s.grade_level] || 0) + 1;
    });

    const list = Object.entries(counts)
      .map(([grade_level, count]) => ({ grade_level, count }))
      .sort((a, b) => a.grade_level.localeCompare(b.grade_level, "ar"));

    setGrades(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const handlePromote = async () => {
    setPromoting(true);
    try {
      let promotedCount = 0;
      let graduatedCount = 0;
      let unmappedCount = 0;

      // الخامسة أولاً: حذف المتخرجين
      const graduatesGrade = "السنة الخامسة ابتدائي";
      const graduateStudents = grades.find((g) => g.grade_level === graduatesGrade);
      if (graduateStudents && graduateStudents.count > 0) {
        // جلب IDs للتلاميذ المتخرجين
        const { data: gradData, error: gradFetchErr } = await supabase
          .from("students")
          .select("id")
          .eq("grade_level", graduatesGrade);

        if (gradFetchErr) throw gradFetchErr;

        const gradIds = (gradData || []).map((s: any) => s.id);
        if (gradIds.length > 0) {
          // حذف روابط أولياء الأمور أولاً
          await supabase.from("parent_students").delete().in("student_id", gradIds);
          // حذف روابط المعلمين
          await supabase.from("teacher_students").delete().in("student_id", gradIds);
          // حذف الحضور والعلامات
          await supabase.from("attendance").delete().in("student_id", gradIds);
          await supabase.from("grades").delete().in("student_id", gradIds);
          // حذف التلاميذ أنفسهم
          const { error: delErr } = await supabase
            .from("students")
            .delete()
            .in("id", gradIds);
          if (delErr) throw delErr;
          graduatedCount = gradIds.length;
        }
      }

      // الترقية بالترتيب التنازلي (من الأعلى إلى الأدنى) لتجنب التضارب
      const orderedGrades = [
        "السنة الرابعة ابتدائي",
        "السنة الثالثة ابتدائي",
        "السنة الثانية ابتدائي",
        "السنة الأولى ابتدائي",
        "سنة أولى",
        "تحضيري",
      ];

      for (const currentGrade of orderedGrades) {
        const nextGrade = PROMOTION_MAP[currentGrade];
        if (!nextGrade) continue;

        const gradeInfo = grades.find((g) => g.grade_level === currentGrade);
        if (!gradeInfo || gradeInfo.count === 0) continue;

        const { error: updateErr } = await supabase
          .from("students")
          .update({ grade_level: nextGrade })
          .eq("grade_level", currentGrade);

        if (updateErr) throw updateErr;
        promotedCount += gradeInfo.count;
      }

      // المستويات غير المعروفة
      grades.forEach((g) => {
        if (!(g.grade_level in PROMOTION_MAP)) {
          unmappedCount += g.count;
        }
      });

      toast.success(
        `تمت الترقية بنجاح: ${promotedCount} تلميذ${
          graduatedCount > 0 ? ` • تخرج ${graduatedCount} تلميذ` : ""
        }${unmappedCount > 0 ? ` • تم تجاهل ${unmappedCount} تلميذ بمستوى غير معروف` : ""}`
      );

      await fetchGrades();
    } catch (error: any) {
      console.error("Promotion error:", error);
      toast.error(`فشلت العملية: ${error.message || "خطأ غير معروف"}`);
    } finally {
      setPromoting(false);
    }
  };

  const totalStudents = grades.reduce((sum, g) => sum + g.count, 0);
  const totalGraduates =
    grades.find((g) => g.grade_level === "السنة الخامسة ابتدائي")?.count || 0;
  const totalPromoted = totalStudents - totalGraduates -
    grades.filter((g) => !(g.grade_level in PROMOTION_MAP)).reduce((s, g) => s + g.count, 0);

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
          <ArrowUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">ترقية نهاية السنة الدراسية</h2>
          <p className="text-sm text-muted-foreground">
            انقل جميع التلاميذ إلى المستوى الأعلى دفعة واحدة
          </p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription className="mr-2">
          <strong>تنبيه:</strong> هذه العملية لا يمكن التراجع عنها. تأكد من أخذ نسخة احتياطية
          قبل المتابعة. تلاميذ السنة الخامسة سيتم حذفهم من النظام (تخرج إلى التعليم المتوسط)
          مع جميع بياناتهم.
        </AlertDescription>
      </Alert>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            المستويات الحالية ({totalStudents} تلميذ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : grades.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">لا يوجد تلاميذ</p>
          ) : (
            <div className="space-y-2">
              {grades.map((g) => {
                const nextGrade = PROMOTION_MAP[g.grade_level];
                const isUnknown = !(g.grade_level in PROMOTION_MAP);
                const isGraduate = nextGrade === null;

                return (
                  <div
                    key={g.grade_level}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="secondary" className="min-w-[60px] justify-center">
                        {g.count}
                      </Badge>
                      <span className="font-medium">{g.grade_level}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {isUnknown ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          مستوى غير معروف - سيُتجاهل
                        </Badge>
                      ) : isGraduate ? (
                        <Badge variant="destructive" className="gap-1">
                          <Trash2 className="w-3 h-3" />
                          تخرج (سيُحذف)
                        </Badge>
                      ) : (
                        <>
                          <ArrowUp className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 dark:text-green-400 font-medium">
                            {nextGrade}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && totalStudents > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              disabled={promoting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg py-6"
            >
              {promoting ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري التنفيذ...
                </>
              ) : (
                <>
                  <ArrowUp className="w-5 h-5 ml-2" />
                  بدء عملية الترقية
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl" className="font-cairo">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد ترقية جميع التلاميذ؟</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span className="block">سيتم تنفيذ التالي:</span>
                <span className="block">• ترقية <strong>{totalPromoted}</strong> تلميذ إلى المستوى الأعلى</span>
                {totalGraduates > 0 && (
                  <span className="block text-destructive">
                    • <strong>حذف نهائي</strong> لـ <strong>{totalGraduates}</strong> تلميذ من السنة الخامسة (متخرجون)
                  </span>
                )}
                <span className="block mt-2 font-semibold">هذا الإجراء لا يمكن التراجع عنه.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePromote}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                نعم، نفّذ الترقية
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
