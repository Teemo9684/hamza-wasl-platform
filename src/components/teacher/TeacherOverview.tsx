import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, GraduationCap, BookOpen } from "lucide-react";
import { StudentSearch } from "./StudentSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface StudentsByGrade {
  [gradeLevel: string]: any[];
}

interface TeacherOverviewProps {
  teacherInfo: { name: string; subject: string };
  studentsCount: number;
  unreadMessagesCount: number;
  students: any[];
  studentsByGrade?: StudentsByGrade;
  isLanguageTeacher?: boolean;
  onSendMessage: (parentId: string, studentId: string) => void;
}

export const TeacherOverview = ({
  teacherInfo,
  studentsCount,
  unreadMessagesCount,
  students,
  studentsByGrade = {},
  isLanguageTeacher = false,
  onSendMessage,
}: TeacherOverviewProps) => {
  const gradeLabels: { [key: string]: string } = {
    'الثالثة': 'السنة الثالثة',
    'الرابعة': 'السنة الرابعة',
    'الخامسة': 'السنة الخامسة',
    '3': 'السنة الثالثة',
    '4': 'السنة الرابعة',
    '5': 'السنة الخامسة',
  };

  const getGradeLabel = (grade: string) => {
    for (const [key, label] of Object.entries(gradeLabels)) {
      if (grade.includes(key)) return label;
    }
    return grade;
  };

  const sortedGrades = Object.keys(studentsByGrade).sort((a, b) => {
    const order = ['الثالثة', 'الرابعة', 'الخامسة', '3', '4', '5'];
    const aIndex = order.findIndex(o => a.includes(o));
    const bIndex = order.findIndex(o => b.includes(o));
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">مرحباً {teacherInfo.name}</h2>
        <p className="text-muted-foreground">{teacherInfo.subject} • إدارة التلاميذ والتواصل مع الأولياء</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد التلاميذ</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsCount}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رسائل غير مقروءة</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessagesCount}</div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المادة</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{teacherInfo.subject}</div>
          </CardContent>
        </Card>
      </div>

      {/* عرض التلاميذ حسب المستوى لأساتذة اللغات */}
      {isLanguageTeacher && sortedGrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              قوائم التلاميذ حسب المستوى
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={sortedGrades[0]} dir="rtl">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sortedGrades.length}, 1fr)` }}>
                {sortedGrades.map((grade) => (
                  <TabsTrigger key={grade} value={grade} className="flex items-center gap-2">
                    {getGradeLabel(grade)}
                    <Badge variant="secondary" className="mr-1">
                      {studentsByGrade[grade]?.length || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {sortedGrades.map((grade) => (
                <TabsContent key={grade} value={grade} className="mt-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg mb-3">
                      {getGradeLabel(grade)} - {studentsByGrade[grade]?.length || 0} تلميذ
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {studentsByGrade[grade]?.map((student, index) => (
                        <Card key={student.id} className="p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{student.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {student.national_school_id}
                                {student.class_section && ` • ${student.class_section}`}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      <StudentSearch students={students} onSendMessage={onSendMessage} />
    </div>
  );
};
