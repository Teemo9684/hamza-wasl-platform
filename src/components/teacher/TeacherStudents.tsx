import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Trash2, GraduationCap } from "lucide-react";
import { useState } from "react";

interface TeacherStudentsProps {
  students: any[];
  onAddStudent: (student: any) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
}

export const TeacherStudents = ({
  students,
  onAddStudent,
  onDeleteStudent,
}: TeacherStudentsProps) => {
  const [newStudent, setNewStudent] = useState({
    full_name: "",
    national_school_id: "",
    grade_level: "",
    class_section: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = async () => {
    await onAddStudent(newStudent);
    setNewStudent({
      full_name: "",
      national_school_id: "",
      grade_level: "",
      class_section: "",
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">إدارة التلاميذ</h2>
          <p className="text-muted-foreground">قائمة التلاميذ المسجلين</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              إضافة تلميذ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة تلميذ جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input
                  id="full_name"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
              <div>
                <Label htmlFor="national_school_id">الرقم الوطني للمدرسة</Label>
                <Input
                  id="national_school_id"
                  value={newStudent.national_school_id}
                  onChange={(e) => setNewStudent({ ...newStudent, national_school_id: e.target.value })}
                  placeholder="أدخل الرقم الوطني"
                />
              </div>
              <div>
                <Label htmlFor="grade_level">المستوى الدراسي</Label>
                <Select
                  value={newStudent.grade_level}
                  onValueChange={(value) => setNewStudent({ ...newStudent, grade_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى" />
                  </SelectTrigger>
                  <SelectContent>
                    {["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة", "السنة الخامسة"].map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="class_section">القسم</Label>
                <Input
                  id="class_section"
                  value={newStudent.class_section}
                  onChange={(e) => setNewStudent({ ...newStudent, class_section: e.target.value })}
                  placeholder="مثال: أ، ب، ج"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {students.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{student.full_name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteStudent(student.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">الرقم الوطني: </span>
                  <span className="text-sm font-medium">{student.national_school_id}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">المستوى: </span>
                  <span className="text-sm font-medium">{student.grade_level}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">القسم: </span>
                  <span className="text-sm font-medium">{student.class_section || "غير محدد"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا يوجد تلاميذ مسجلين حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
