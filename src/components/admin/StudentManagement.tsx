import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Plus, Edit, Trash2, Save, X, Search } from "lucide-react";
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
  "السنة الأولى",
  "السنة الثانية",
  "السنة الثالثة",
  "السنة الرابعة",
  "السنة الخامسة",
];

const classSections = ["أ", "ب", "ج", "د"];

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    national_school_id: "",
    grade_level: "",
    class_section: "",
    date_of_birth: "",
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("grade_level", { ascending: true })
        .order("class_section", { ascending: true });

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
      class_section: student.class_section || "",
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
      class_section: "",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-cairo">إدارة التلاميذ</h2>
        <Button
          onClick={() => setIsAddingStudent(true)}
          className="font-cairo"
        >
          <Plus className="ml-2 h-4 w-4" />
          إضافة تلميذ جديد
        </Button>
      </div>

      {/* Add/Edit Form */}
      {isAddingStudent && (
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class_section" className="font-cairo">
                    القسم
                  </Label>
                  <Select
                    value={formData.class_section}
                    onValueChange={(value) => setFormData({ ...formData, class_section: value })}
                  >
                    <SelectTrigger className="font-cairo">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {classSections.map((section) => (
                        <SelectItem key={section} value={section} className="font-cairo">
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث عن تلميذ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 font-cairo"
        />
      </div>

      {/* Students Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-cairo">قائمة التلاميذ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground font-cairo">
              جاري التحميل...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-cairo">
              لا توجد بيانات
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-cairo">الاسم الكامل</TableHead>
                  <TableHead className="font-cairo">الرقم التعريفي</TableHead>
                  <TableHead className="font-cairo">المستوى</TableHead>
                  <TableHead className="font-cairo">القسم</TableHead>
                  <TableHead className="font-cairo">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-cairo font-medium">
                      {student.full_name}
                    </TableCell>
                    <TableCell className="font-cairo">
                      {student.national_school_id}
                    </TableCell>
                    <TableCell className="font-cairo">
                      {student.grade_level}
                    </TableCell>
                    <TableCell className="font-cairo">
                      {student.class_section || "-"}
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

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo text-lg">
              <GraduationCap className="w-5 h-5 text-primary" />
              إجمالي التلاميذ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{students.length}</p>
          </CardContent>
        </Card>

        {gradeLevels.slice(0, 2).map((level) => (
          <Card key={level} className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                {level}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {students.filter(s => s.grade_level === level).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
