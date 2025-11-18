import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, GraduationCap } from "lucide-react";
import { StudentSearch } from "./StudentSearch";

interface TeacherOverviewProps {
  teacherInfo: { name: string; subject: string };
  studentsCount: number;
  unreadMessagesCount: number;
  students: any[];
  onSendMessage: (parentId: string, studentId: string) => void;
}

export const TeacherOverview = ({
  teacherInfo,
  studentsCount,
  unreadMessagesCount,
  students,
  onSendMessage,
}: TeacherOverviewProps) => {
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

      <StudentSearch students={students} onSendMessage={onSendMessage} />
    </div>
  );
};
