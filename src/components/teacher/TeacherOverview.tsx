import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, GraduationCap, BookOpen, ChevronDown } from "lucide-react";
import { StudentSearch } from "./StudentSearch";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { AnimatedContainer, AnimatedItem, AnimatedCard } from "@/components/AnimatedSection";

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
  const [openGrades, setOpenGrades] = useState<string[]>([]);

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

  const getShortGradeLabel = (grade: string) => {
    if (grade.includes('الثالثة') || grade.includes('3')) return 'الثالثة';
    if (grade.includes('الرابعة') || grade.includes('4')) return 'الرابعة';
    if (grade.includes('الخامسة') || grade.includes('5')) return 'الخامسة';
    return grade;
  };

  const sortedGrades = Object.keys(studentsByGrade).sort((a, b) => {
    const order = ['الثالثة', 'الرابعة', 'الخامسة', '3', '4', '5'];
    const aIndex = order.findIndex(o => a.includes(o));
    const bIndex = order.findIndex(o => b.includes(o));
    return aIndex - bIndex;
  });

  const toggleGrade = (grade: string) => {
    setOpenGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    );
  };

  return (
    <AnimatedContainer className="space-y-6">
      <AnimatedItem>
        <div>
          <h2 className="text-3xl font-bold mb-2">مرحباً {teacherInfo.name}</h2>
          <p className="text-muted-foreground">{teacherInfo.subject} • إدارة التلاميذ والتواصل مع الأولياء</p>
        </div>
      </AnimatedItem>

      <AnimatedItem className="grid gap-6 md:grid-cols-3">
        <AnimatedCard>
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد التلاميذ</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentsCount}</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard>
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رسائل غير مقروءة</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadMessagesCount}</div>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard>
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المادة</CardTitle>
              <GraduationCap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{teacherInfo.subject}</div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </AnimatedItem>

      {/* عرض التلاميذ حسب المستوى لأساتذة اللغات */}
      {isLanguageTeacher && sortedGrades.length > 0 && (
        <AnimatedItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                قوائم التلاميذ حسب المستوى
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedGrades.map((grade) => (
                <Collapsible
                  key={grade}
                  open={openGrades.includes(grade)}
                  onOpenChange={() => toggleGrade(grade)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <ChevronDown 
                        className={`h-5 w-5 text-primary transition-transform duration-200 ${
                          openGrades.includes(grade) ? 'rotate-180' : ''
                        }`} 
                      />
                      <span className="font-semibold text-base">
                        {getShortGradeLabel(grade)}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-sm px-3">
                      {studentsByGrade[grade]?.length || 0} تلميذ
                    </Badge>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="pt-3">
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {studentsByGrade[grade]?.map((student, index) => (
                        <Card key={student.id} className="p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
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
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      <AnimatedItem>
        <StudentSearch students={students} onSendMessage={onSendMessage} />
      </AnimatedItem>
    </AnimatedContainer>
  );
};