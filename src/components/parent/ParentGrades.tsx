import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface ParentGradesProps {
  grades: any[];
  selectedChild: string;
}

export const ParentGrades = ({ grades, selectedChild }: ParentGradesProps) => {
  const childGrades = grades.filter(g => g.student_id === selectedChild);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">التقييمات والدرجات</h2>
        <p className="text-muted-foreground">متابعة التحصيل الدراسي</p>
      </div>

      {childGrades.length > 0 ? (
        <div className="grid gap-4">
          {childGrades.map((grade) => (
            <Card key={grade.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{grade.subject}</CardTitle>
                  </div>
                  <Badge variant="secondary">{grade.grade_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الدرجة:</span>
                  <span className="text-2xl font-bold text-primary">
                    {grade.grade_value}/{grade.max_grade}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">النسبة المئوية:</span>
                  <span className="font-semibold">
                    {((grade.grade_value / grade.max_grade) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">التاريخ:</span>
                  <span className="text-sm">
                    {new Date(grade.date).toLocaleDateString('ar-DZ')}
                  </span>
                </div>
                {grade.notes && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">ملاحظات:</p>
                    <p className="text-sm">{grade.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد درجات مسجلة حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
