import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Plus, Edit, Trash2, Save, X, Search, User, UserPlus } from "lucide-react";
import { studentSchema } from "@/lib/validations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Student {
  id: string;
  full_name: string;
  national_school_id: string;
  grade_level: string;
  class_section: string | null;
  date_of_birth: string | null;
  created_at: string;
}

const gradeLevels = [
  "تحضيري",
  "السنة الأولى ابتدائي",
  "السنة الثانية ابتدائي",
  "السنة الثالثة ابتدائي",
  "السنة الرابعة ابتدائي",
  "السنة الخامسة ابتدائي",
];

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    national_school_id: "",
    grade_level: "",
    date_of_birth: "",
  });
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [gradeTeachers, setGradeTeachers] = useState<Record<string, any>>({});
  const [assigningGrade, setAssigningGrade] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchGradeTeachers();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("grade_level", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل التلاميذ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", 
          (await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "teacher")
          ).data?.map(r => r.user_id) || []
        );

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchGradeTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teacher_grade_levels")
        .select(`
          grade_level,
          teacher:profiles(id, full_name)
        `);

      if (error) throw error;
      
      const teacherMap: Record<string, any> = {};
      data?.forEach((item: any) => {
        teacherMap[item.grade_level] = item.teacher;
      });
      setGradeTeachers(teacherMap);
    } catch (error) {
      console.error("Error fetching grade teachers:", error);
    }
  };

  const handleAssignTeacher = async (gradeLevel: string, teacherId: string) => {
    try {
      const { error } = await supabase
        .from("teacher_grade_levels")
        .upsert({
          teacher_id: teacherId,
          grade_level: gradeLevel,
        }, {
          onConflict: "teacher_id,grade_level"
        });

      if (error) throw error;

      toast({
        title: "نجاح",
        description: "تم ربط الأستاذ بالمستوى بنجاح",
      });

      fetchGradeTeachers();
      setAssigningGrade(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل ربط الأستاذ بالمستوى",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data using zod schema
      const validatedData = studentSchema.parse(formData);

      if (editingStudent) {
        const { error } = await supabase
          .from("students")
          .update(validatedData)
          .eq("id", editingStudent.id);

        if (error) throw error;

        toast({
          title: "نجاح",
          description: "تم تحديث بيانات التلميذ بنجاح",
        });
      } else {
        const { error } = await supabase
          .from("students")
          .insert([validatedData]);

        if (error) throw error;

        toast({
          title: "نجاح",
          description: "تم إضافة التلميذ بنجاح",
        });
      }

      resetForm();
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.errors?.[0]?.message || error.message || "فشل حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      national_school_id: student.national_school_id,
      grade_level: student.grade_level,
      date_of_birth: student.date_of_birth || "",
    });
    setIsAddingStudent(true);
  };

  const handleDelete = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) throw error;

      toast({
        title: "نجاح",
        description: "تم حذف التلميذ بنجاح",
      });

      fetchStudents();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حذف التلميذ",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      national_school_id: "",
      grade_level: "",
      date_of_birth: "",
    });
    setIsAddingStudent(false);
    setEditingStudent(null);
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.national_school_id.includes(searchTerm) ||
    student.grade_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get students count for each grade
  const getGradeStudentsCount = (grade: string) => {
    return students.filter(s => s.grade_level === grade).length;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-4">
        {selectedGrade && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedGrade(null);
              setSearchTerm("");
              setIsAddingStudent(false);
            }}
            className="font-cairo"
          >
            <X className="ml-2 h-4 w-4" />
            العودة للأقسام
          </Button>
        )}
        <h2 className="text-3xl font-bold font-cairo">
          {selectedGrade ? selectedGrade : "إدارة التلاميذ"}
        </h2>
      </div>

      {/* Add Student Button - Below Grade Title */}
      {selectedGrade && (
        <div>
          <Button
            onClick={() => {
              setFormData({ ...formData, grade_level: selectedGrade });
              setIsAddingStudent(true);
            }}
            className="font-cairo"
          >
            <Plus className="ml-2 h-4 w-4" />
            إضافة تلميذ جديد
          </Button>
        </div>
      )}

      {/* Sections Grid - Show only when no grade is selected */}
      {!selectedGrade && !loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gradeLevels.map((level) => {
            const studentsCount = getGradeStudentsCount(level);
            const assignedTeacher = gradeTeachers[level];

            return (
              <Card 
                key={level} 
                className="glass-card hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedGrade(level)}
              >
                <CardHeader>
                  <CardTitle className="font-cairo flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-primary" />
                      {level}
                    </div>
                    <span className="text-2xl font-bold text-primary">
                      {studentsCount}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-cairo">
                      عدد التلاميذ
                    </span>
                    <span className="font-medium font-cairo">
                      {studentsCount} تلميذ
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-muted-foreground font-cairo">
                      الأستاذ المسؤول
                    </span>
                    {assignedTeacher ? (
                      <span className="font-medium font-cairo text-sm">
                        {assignedTeacher.full_name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground font-cairo">
                        لم يتم التعيين
                      </span>
                    )}
                  </div>

                  <Dialog 
                    open={assigningGrade === level} 
                    onOpenChange={(open) => {
                      setAssigningGrade(open ? level : null);
                    }}
                  >
                    <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="w-full font-cairo">
                        <UserPlus className="w-4 h-4 ml-2" />
                        {assignedTeacher ? "تغيير الأستاذ" : "تعيين أستاذ"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-cairo">تعيين أستاذ للمستوى</DialogTitle>
                        <DialogDescription className="font-cairo">
                          اختر الأستاذ المسؤول عن {level}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select onValueChange={(value) => handleAssignTeacher(level, value)}>
                          <SelectTrigger className="font-cairo">
                            <SelectValue placeholder="اختر الأستاذ" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id} className="font-cairo">
                                {teacher.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form - Show only when grade is selected */}
      {selectedGrade && isAddingStudent && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-cairo">
              {editingStudent ? "تعديل بيانات التلميذ" : "إضافة تلميذ جديد"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="font-cairo">
                    الاسم الكامل *
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="font-cairo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="national_school_id" className="font-cairo">
                    الرقم التعريفي الوطني *
                  </Label>
                  <Input
                    id="national_school_id"
                    value={formData.national_school_id}
                    onChange={(e) => setFormData({ ...formData, national_school_id: e.target.value })}
                    className="font-cairo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade_level" className="font-cairo">
                    المستوى الدراسي *
                  </Label>
                  <Select
                    value={formData.grade_level}
                    onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
                    disabled={selectedGrade !== null}
                  >
                    <SelectTrigger className="font-cairo">
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeLevels.map((level) => (
                        <SelectItem key={level} value={level} className="font-cairo">
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGrade && (
                    <p className="text-xs text-muted-foreground font-cairo">
                      سيتم إضافة التلميذ في {selectedGrade}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="font-cairo">
                    تاريخ الميلاد
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="font-cairo"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={resetForm} className="font-cairo">
                  <X className="ml-2 h-4 w-4" />
                  إلغاء
                </Button>
                <Button type="submit" className="font-cairo">
                  <Save className="ml-2 h-4 w-4" />
                  حفظ
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search - Show only when grade is selected */}
      {selectedGrade && (
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن تلميذ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 font-cairo"
          />
        </div>
      )}

      {/* Students List - Show only when grade is selected */}
      {selectedGrade && loading ? (
        <Card className="glass-card">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground font-cairo">
              جاري التحميل...
            </div>
          </CardContent>
        </Card>
      ) : selectedGrade && filteredStudents.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground font-cairo">
              لا توجد بيانات
            </div>
          </CardContent>
        </Card>
      ) : selectedGrade ? (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-cairo flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                {selectedGrade} ({filteredStudents.filter(s => s.grade_level === selectedGrade).length} تلميذ)
              </CardTitle>
              <div className="flex items-center gap-2">
                {gradeTeachers[selectedGrade] ? (
                  <div className="flex items-center gap-2 text-sm font-cairo">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">الأستاذ:</span>
                    <span className="font-medium">{gradeTeachers[selectedGrade].full_name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground font-cairo">لم يتم تعيين أستاذ</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.filter(s => s.grade_level === selectedGrade).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-cairo">
                لا يوجد تلاميذ في هذا المستوى
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-cairo">الاسم الكامل</TableHead>
                    <TableHead className="font-cairo">الرقم التعريفي</TableHead>
                    <TableHead className="font-cairo">تاريخ الميلاد</TableHead>
                    <TableHead className="font-cairo">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents
                    .filter(s => s.grade_level === selectedGrade)
                    .map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-cairo font-medium">
                          {student.full_name}
                        </TableCell>
                        <TableCell className="font-cairo">
                          {student.national_school_id}
                        </TableCell>
                        <TableCell className="font-cairo">
                          {student.date_of_birth || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(student)}
                              className="font-cairo"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive font-cairo"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="font-cairo">
                                    تأكيد الحذف
                                  </DialogTitle>
                                  <DialogDescription className="font-cairo">
                                    هل أنت متأكد من حذف هذا التلميذ؟ لا يمكن التراجع عن هذا الإجراء.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(student.id)}
                                    className="font-cairo"
                                  >
                                    حذف
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Statistics - Show only when no grade is selected */}
      {!selectedGrade && !loading && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo text-lg">
              <GraduationCap className="w-5 h-5 text-primary" />
              الإحصائيات العامة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{students.length}</p>
                <p className="text-sm text-muted-foreground font-cairo mt-1">إجمالي التلاميذ</p>
              </div>
              {gradeLevels.slice(0, 5).map((level) => (
                <div key={level} className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">
                    {students.filter(s => s.grade_level === level).length}
                  </p>
                  <p className="text-sm text-muted-foreground font-cairo mt-1">{level}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
