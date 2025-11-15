import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Award } from "lucide-react";

interface ParentOverviewProps {
  children: any[];
  selectedChild: string;
  grades: any[];
  attendance: any[];
  calculateAverage: (childId: string) => number;
  calculateAttendanceRate: (childId: string) => number;
}

export const ParentOverview = ({
  children,
  selectedChild,
  grades,
  attendance,
  calculateAverage,
  calculateAttendanceRate,
}: ParentOverviewProps) => {
  const selectedChildData = children.find(c => c.id === selectedChild);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">نظرة عامة</h2>
        <p className="text-muted-foreground">متابعة الأداء الأكاديمي لأبنائك</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الأبناء</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة الحضور</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedChild ? `${calculateAttendanceRate(selectedChild)}%` : "-"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المعدل العام</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedChild ? calculateAverage(selectedChild).toFixed(2) : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedChildData && (
        <Card>
          <CardHeader>
            <CardTitle>معلومات الطالب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                <p className="font-medium">{selectedChildData.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الرقم الوطني للمدرسة</p>
                <p className="font-medium">{selectedChildData.national_school_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المستوى الدراسي</p>
                <p className="font-medium">{selectedChildData.grade_level}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">القسم</p>
                <p className="font-medium">{selectedChildData.class_section || "غير محدد"}</p>
              </div>
              {selectedChildData.date_of_birth && (
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الميلاد</p>
                  <p className="font-medium">
                    {new Date(selectedChildData.date_of_birth).toLocaleDateString('ar-DZ')}
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
