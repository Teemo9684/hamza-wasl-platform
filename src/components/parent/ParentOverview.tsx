import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar } from "lucide-react";

interface ParentOverviewProps {
  children: any[];
  selectedChild: string;
  attendance: any[];
  calculateAttendanceRate: (childId: string) => number;
}

export const ParentOverview = ({
  children,
  selectedChild,
  attendance,
  calculateAttendanceRate,
}: ParentOverviewProps) => {
  const selectedChildData = children.find(c => c.id === selectedChild);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">نظرة عامة</h2>
        <p className="text-sm md:text-base text-muted-foreground">متابعة الأداء الأكاديمي لأبنائك</p>
      </div>

      <div className="grid gap-3 md:gap-6 grid-cols-2">
        <Card className="border-primary/20 active:scale-[0.98] transition-transform touch-feedback">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">عدد الأبناء</CardTitle>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-bold">{children.length}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 active:scale-[0.98] transition-transform touch-feedback">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">نسبة الحضور</CardTitle>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-bold">
              {selectedChild ? `${calculateAttendanceRate(selectedChild)}%` : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedChildData && (
        <Card className="overflow-hidden">
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">معلومات الطالب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-0">
            <div className="grid gap-3 md:gap-4 grid-cols-2">
              <div className="bg-muted/30 rounded-lg p-2.5 md:p-3">
                <p className="text-[11px] md:text-sm text-muted-foreground mb-0.5">الاسم الكامل</p>
                <p className="font-medium text-sm md:text-base truncate">{selectedChildData.full_name}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 md:p-3">
                <p className="text-[11px] md:text-sm text-muted-foreground mb-0.5">الرقم الوطني</p>
                <p className="font-medium text-sm md:text-base truncate">{selectedChildData.national_school_id}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 md:p-3">
                <p className="text-[11px] md:text-sm text-muted-foreground mb-0.5">المستوى الدراسي</p>
                <p className="font-medium text-sm md:text-base truncate">{selectedChildData.grade_level}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 md:p-3">
                <p className="text-[11px] md:text-sm text-muted-foreground mb-0.5">القسم</p>
                <p className="font-medium text-sm md:text-base truncate">{selectedChildData.class_section || "غير محدد"}</p>
              </div>
              {selectedChildData.date_of_birth && (
                <div className="bg-muted/30 rounded-lg p-2.5 md:p-3 col-span-2">
                  <p className="text-[11px] md:text-sm text-muted-foreground mb-0.5">تاريخ الميلاد</p>
                  <p className="font-medium text-sm md:text-base">
                    {new Date(selectedChildData.date_of_birth).toLocaleDateString('ar-u-nu-latn')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
