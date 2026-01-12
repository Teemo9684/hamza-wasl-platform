import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Plus, Edit, Trash2, Save, X, Search, User, UserPlus, Upload, Sparkles, ArrowRight, Home, AlertTriangle, FileText } from "lucide-react";
import { studentSchema } from "@/lib/validations";
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
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

// Configure PDF.js worker - use unpkg CDN which is more reliable
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

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
  const [extractedStudents, setExtractedStudents] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDeletingGrade, setIsDeletingGrade] = useState(false);
  const [deleteConfirmGrade, setDeleteConfirmGrade] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleStudentsChange = useCallback(() => {
    fetchStudents();
    fetchGradeTeachers();
  }, []);

  // Real-time subscription for students
  useRealtime({
    table: 'students',
    onChange: handleStudentsChange,
  });

  // Real-time subscription for teacher assignments
  useRealtime({
    table: 'teacher_grade_levels',
    onChange: handleStudentsChange,
  });

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
      // أولاً: جلب معرفات المعلمين
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      if (roleError) throw roleError;

      const teacherIds = roleData?.map(r => r.user_id) || [];
      
      if (teacherIds.length === 0) {
        setTeachers([]);
        return;
      }

      // ثانياً: جلب بيانات المعلمين
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", teacherIds);

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
    // إغلاق الحوار فوراً لتحسين تجربة المستخدم
    setAssigningGrade(null);
    
    try {
      // أولاً: جلب جميع تلاميذ هذا المستوى الدراسي
      const { data: studentsInGrade, error: studentsError } = await supabase
        .from("students")
        .select("id")
        .eq("grade_level", gradeLevel);

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        throw studentsError;
      }

      // ثانياً: حذف أي ربط سابق لهذا المستوى في teacher_grade_levels
      const { error: deleteGradeError } = await supabase
        .from("teacher_grade_levels")
        .delete()
        .eq("grade_level", gradeLevel);

      if (deleteGradeError) {
        console.error("Error deleting old grade assignment:", deleteGradeError);
        throw deleteGradeError;
      }

      // ثالثاً: حذف أي ربط سابق في teacher_students لتلاميذ هذا المستوى
      if (studentsInGrade && studentsInGrade.length > 0) {
        const studentIds = studentsInGrade.map(s => s.id);
        const { error: deleteStudentsError } = await supabase
          .from("teacher_students")
          .delete()
          .in("student_id", studentIds);

        if (deleteStudentsError) {
          console.error("Error deleting old student links:", deleteStudentsError);
        }
      }

      // رابعاً: إضافة الربط الجديد في teacher_grade_levels
      const { data: insertData, error: insertError } = await supabase
        .from("teacher_grade_levels")
        .insert({
          teacher_id: teacherId,
          grade_level: gradeLevel,
        })
        .select(`
          grade_level,
          teacher:profiles(id, full_name)
        `)
        .single();

      if (insertError) {
        console.error("Error inserting grade assignment:", insertError);
        throw insertError;
      }

      // خامساً: ربط جميع تلاميذ المستوى بالأستاذ في teacher_students
      if (studentsInGrade && studentsInGrade.length > 0) {
        const teacherStudentLinks = studentsInGrade.map(student => ({
          teacher_id: teacherId,
          student_id: student.id,
        }));

        const { error: linkError } = await supabase
          .from("teacher_students")
          .insert(teacherStudentLinks);

        if (linkError) {
          console.error("Error linking students to teacher:", linkError);
        }
      }

      // تحديث الحالة محلياً فوراً
      if (insertData) {
        setGradeTeachers(prev => ({
          ...prev,
          [gradeLevel]: insertData.teacher
        }));
      }

      toast({
        title: "نجاح",
        description: `تم ربط الأستاذ بالمستوى وتلاميذه (${studentsInGrade?.length || 0} تلميذ)`,
      });

    } catch (error: any) {
      console.error("Error assigning teacher:", error);
      await fetchGradeTeachers();
      toast({
        title: "خطأ",
        description: error.message || "فشل ربط الأستاذ بالمستوى",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTeacherAssignment = async (gradeLevel: string) => {
    try {
      // جلب جميع تلاميذ هذا المستوى الدراسي
      const { data: studentsInGrade, error: studentsError } = await supabase
        .from("students")
        .select("id")
        .eq("grade_level", gradeLevel);

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        throw studentsError;
      }

      // حذف ربط المستوى من teacher_grade_levels
      const { error: deleteGradeError } = await supabase
        .from("teacher_grade_levels")
        .delete()
        .eq("grade_level", gradeLevel);

      if (deleteGradeError) {
        console.error("Error deleting grade assignment:", deleteGradeError);
        throw deleteGradeError;
      }

      // حذف روابط التلاميذ في teacher_students
      if (studentsInGrade && studentsInGrade.length > 0) {
        const studentIds = studentsInGrade.map(s => s.id);
        const { error: deleteStudentsError } = await supabase
          .from("teacher_students")
          .delete()
          .in("student_id", studentIds);

        if (deleteStudentsError) {
          console.error("Error deleting student links:", deleteStudentsError);
        }
      }

      // تحديث الحالة محلياً
      setGradeTeachers(prev => {
        const newState = { ...prev };
        delete newState[gradeLevel];
        return newState;
      });

      toast({
        title: "نجاح",
        description: `تم إزالة إسناد الأستاذ من المستوى وتلاميذه (${studentsInGrade?.length || 0} تلميذ)`,
      });

    } catch (error: any) {
      console.error("Error removing teacher assignment:", error);
      await fetchGradeTeachers();
      toast({
        title: "خطأ",
        description: error.message || "فشل إزالة إسناد الأستاذ",
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

  // حذف جميع تلاميذ مستوى دراسي معين
  const handleDeleteAllGradeStudents = async (gradeLevel: string) => {
    setIsDeletingGrade(true);
    try {
      // جلب جميع تلاميذ هذا المستوى
      const studentsInGrade = students.filter(s => s.grade_level === gradeLevel);
      
      if (studentsInGrade.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا يوجد تلاميذ في هذا المستوى",
        });
        return;
      }

      const studentIds = studentsInGrade.map(s => s.id);

      // أولاً: حذف روابط التلاميذ في teacher_students
      const { error: linkError } = await supabase
        .from("teacher_students")
        .delete()
        .in("student_id", studentIds);

      if (linkError) {
        console.error("Error deleting teacher-student links:", linkError);
      }

      // ثانياً: حذف روابط الأولياء في parent_students
      const { error: parentLinkError } = await supabase
        .from("parent_students")
        .delete()
        .in("student_id", studentIds);

      if (parentLinkError) {
        console.error("Error deleting parent-student links:", parentLinkError);
      }

      // ثالثاً: حذف الحضور المرتبط
      const { error: attendanceError } = await supabase
        .from("attendance")
        .delete()
        .in("student_id", studentIds);

      if (attendanceError) {
        console.error("Error deleting attendance records:", attendanceError);
      }

      // رابعاً: حذف جميع التلاميذ
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("grade_level", gradeLevel);

      if (error) throw error;

      toast({
        title: "نجاح",
        description: `تم حذف ${studentsInGrade.length} تلميذ من ${gradeLevel}`,
      });

      setDeleteConfirmGrade(null);
      fetchStudents();
    } catch (error: any) {
      console.error("Error deleting grade students:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل حذف التلاميذ",
        variant: "destructive",
      });
    } finally {
      setIsDeletingGrade(false);
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

  // دالة تحويل صفحة PDF إلى صورة base64
  const pdfPageToImage = async (pdf: any, pageNum: number, scale: number = 1.5): Promise<string> => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to create canvas context');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    // تحويل إلى JPEG للحصول على حجم أصغر
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedGrade) return;

    // التحقق من نوع الملف
    if (file.type !== 'application/pdf') {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف PDF صالح",
        variant: "destructive",
      });
      return;
    }

    // التحقق من حجم الملف (الحد الأقصى 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 20MB",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      toast({
        title: "جاري المعالجة",
        description: "يتم تحويل ملف PDF إلى صور وتحليلها...",
      });

      // فتح ملف PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      console.log('PDF loaded, pages:', pdf.numPages);
      
      // تحويل كل صفحة إلى صورة واستخراج البيانات
      const allExtractedStudents: any[] = [];
      
      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
        toast({
          title: "جاري المعالجة",
          description: `معالجة الصفحة ${pageNum} من ${Math.min(pdf.numPages, 10)}...`,
        });
        
        try {
          const imageBase64 = await pdfPageToImage(pdf, pageNum);
          console.log(`Page ${pageNum} converted to image`);
          
          // إرسال الصورة إلى Edge Function للتحليل
          const { data, error } = await supabase.functions.invoke('extract-students-from-image', {
            body: { 
              imageBase64: imageBase64,
              gradeLevel: selectedGrade 
            }
          });

          if (error) {
            console.error(`Error processing page ${pageNum}:`, error);
            continue;
          }

          if (data?.students && data.students.length > 0) {
            // إضافة المستوى الدراسي وبيانات القسم
            const studentsWithInfo = data.students.map((s: any) => ({
              ...s,
              grade_level: selectedGrade,
              date_of_birth: s.date_of_birth || null,
              class_section: s.class_section || data.detected_class || null,
              page_number: pageNum
            }));
            
            allExtractedStudents.push(...studentsWithInfo);
            console.log(`Page ${pageNum}: extracted ${data.students.length} students`);
          }
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
        }
      }

      if (allExtractedStudents.length > 0) {
        setExtractedStudents(allExtractedStudents);
        
        toast({
          title: "نجح الاستخراج",
          description: `تم استخراج ${allExtractedStudents.length} تلميذ من ${Math.min(pdf.numPages, 10)} صفحات`,
        });
      } else {
        toast({
          title: "لم يتم العثور على بيانات",
          description: "لم يتم استخراج أي بيانات تلاميذ من الملف. تأكد من وضوح الملف",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error extracting students from PDF:', error);
      toast({
        title: "خطأ في استخراج البيانات",
        description: error.message || "فشل استخراج البيانات من ملف PDF. حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      // Reset file input
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const handleConfirmExtractedStudents = async () => {
    try {
      const studentsToInsert = extractedStudents.map(s => ({
        full_name: s.full_name,
        national_school_id: s.national_school_id || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        grade_level: selectedGrade,
        class_section: s.class_section || null,
        date_of_birth: s.date_of_birth || null
      }));

      const { error } = await supabase
        .from("students")
        .insert(studentsToInsert);

      if (error) throw error;

      toast({
        title: "نجح الحفظ",
        description: `تم إضافة ${extractedStudents.length} تلميذ بنجاح`,
      });

      setExtractedStudents([]);
      fetchStudents();
    } catch (error) {
      console.error('Error saving extracted students:', error);
      toast({
        title: "خطأ",
        description: "فشل حفظ التلاميذ",
        variant: "destructive",
      });
    }
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

      {/* Add Student Button & AI Extract Button - Below Grade Title */}
      {selectedGrade && (
        <div className="flex flex-wrap items-center gap-3">
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
          
          <div>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePDFUpload}
              className="hidden"
              id="pdf-upload"
            />
            <Button
              onClick={() => pdfInputRef.current?.click()}
              disabled={isExtracting}
              variant="outline"
              className="font-cairo"
            >
              <FileText className="ml-2 h-4 w-4" />
              {isExtracting ? "جاري الاستخراج..." : "استخراج من PDF"}
            </Button>
          </div>

          {/* Delete All Grade Students Button */}
          {getGradeStudentsCount(selectedGrade) > 0 && (
            <Dialog open={deleteConfirmGrade === selectedGrade} onOpenChange={(open) => setDeleteConfirmGrade(open ? selectedGrade : null)}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="font-cairo"
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف جميع التلاميذ ({getGradeStudentsCount(selectedGrade)})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-cairo flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    تحذير: حذف جميع تلاميذ القسم
                  </DialogTitle>
                  <DialogDescription className="font-cairo text-right space-y-2">
                    <p>أنت على وشك حذف <strong>{getGradeStudentsCount(selectedGrade)}</strong> تلميذ من <strong>{selectedGrade}</strong>.</p>
                    <p className="text-destructive font-medium">هذا الإجراء لا يمكن التراجع عنه!</p>
                    <p>سيتم أيضاً حذف:</p>
                    <ul className="list-disc list-inside mr-4 text-muted-foreground">
                      <li>جميع سجلات الحضور</li>
                      <li>روابط الأولياء</li>
                      <li>روابط الأساتذة</li>
                    </ul>
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmGrade(null)}
                    className="font-cairo"
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteAllGradeStudents(selectedGrade)}
                    disabled={isDeletingGrade}
                    className="font-cairo"
                  >
                    {isDeletingGrade ? "جاري الحذف..." : "تأكيد الحذف"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
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
                className="glass-card hover:shadow-lg transition-all"
              >
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setSelectedGrade(level)}
                >
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
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedGrade(level)}
                  >
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

                  <div className="flex gap-2">
                    <Dialog 
                      open={assigningGrade === level} 
                      onOpenChange={(open) => {
                        setAssigningGrade(open ? level : null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 font-cairo">
                          <UserPlus className="w-4 h-4 ml-2" />
                          {assignedTeacher ? "تغيير" : "تعيين أستاذ"}
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
                    
                    {assignedTeacher && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveTeacherAssignment(level)}
                        className="font-cairo"
                        title="إزالة الإسناد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Extracted Students Preview */}
      {selectedGrade && extractedStudents.length > 0 && (
        <Card className="glass-card border-primary border-2">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-cairo flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                التلاميذ المستخرجون من الصورة
              </div>
              <span className="text-lg bg-primary text-primary-foreground px-3 py-1 rounded-full">
                {extractedStudents.length} تلميذ
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="font-cairo text-right">#</TableHead>
                      <TableHead className="font-cairo text-right">الاسم الكامل</TableHead>
                      <TableHead className="font-cairo text-right">رقم التعريف الوطني</TableHead>
                      <TableHead className="font-cairo text-right">تاريخ الميلاد</TableHead>
                      <TableHead className="font-cairo text-right">القسم</TableHead>
                      <TableHead className="font-cairo text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedStudents.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-cairo font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-cairo font-medium">
                          {student.full_name}
                        </TableCell>
                        <TableCell className="font-cairo font-mono text-sm">
                          {student.national_school_id || (
                            <span className="text-muted-foreground text-xs">سيتم إنشاء تلقائي</span>
                          )}
                        </TableCell>
                        <TableCell className="font-cairo">
                          {student.date_of_birth || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-cairo">
                          {student.class_section || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExtractedStudents(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex gap-2 justify-between items-center border-t pt-4">
                <p className="text-sm text-muted-foreground font-cairo">
                  راجع البيانات قبل التأكيد. يمكنك إزالة أي تلميذ بالضغط على ✕
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setExtractedStudents([])}
                    className="font-cairo"
                  >
                    <X className="ml-2 h-4 w-4" />
                    إلغاء الكل
                  </Button>
                  <Button
                    onClick={handleConfirmExtractedStudents}
                    className="font-cairo"
                  >
                    <Save className="ml-2 h-4 w-4" />
                    تأكيد وإضافة ({extractedStudents.length}) تلميذ
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
              {gradeLevels.map((level) => (
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
