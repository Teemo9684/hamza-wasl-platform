import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, User, Phone, Calendar, IdCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudentSearchProps {
  students: any[];
  onSendMessage: (parentId: string, studentId: string) => void;
}

export const StudentSearch = ({ students, onSendMessage }: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [parentInfo, setParentInfo] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const filteredStudents = students.filter((student) =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.national_school_id.includes(searchQuery)
  );

  const handleStudentSelect = async (student: any) => {
    setSelectedStudent(student);
    setSearchQuery("");
    setShowResults(false);

    // Fetch parent information
    try {
      const { data: parentData, error } = await supabase
        .from('parent_students')
        .select(`
          parent_id,
          relationship,
          parent:profiles!parent_students_parent_id_fkey(full_name, phone)
        `)
        .eq('student_id', student.id)
        .maybeSingle();

      if (error) throw error;
      setParentInfo(parentData);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل تحميل معلومات ولي الأمر",
        variant: "destructive",
      });
    }
  };

  const handleContactParent = () => {
    if (parentInfo && selectedStudent) {
      onSendMessage(parentInfo.parent_id, selectedStudent.id);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث عن تلميذ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="ابحث باسم التلميذ أو الرقم الوطني..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(e.target.value.length > 0);
              }}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            
            {showResults && searchQuery.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-md shadow-lg max-h-64 overflow-y-auto z-50">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleStudentSelect(student)}
                      className="w-full text-right px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                    >
                      <div className="font-semibold">{student.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.grade_level} • {student.national_school_id}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-muted-foreground text-center">
                    لا توجد نتائج
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedStudent && (
        <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              معلومات التلميذ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">الاسم الكامل</span>
                </div>
                <div className="text-lg font-bold">{selectedStudent.full_name}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="h-4 w-4" />
                  <span className="text-sm font-medium">الرقم الوطني</span>
                </div>
                <div className="text-lg font-bold">{selectedStudent.national_school_id}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">القسم</span>
                </div>
                <div className="text-lg font-bold">{selectedStudent.grade_level}</div>
              </div>

              {selectedStudent.class_section && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">الشعبة</span>
                  </div>
                  <div className="text-lg font-bold">{selectedStudent.class_section}</div>
                </div>
              )}

              {selectedStudent.date_of_birth && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">تاريخ الميلاد</span>
                  </div>
                  <div className="text-lg font-bold">
                    {new Date(selectedStudent.date_of_birth).toLocaleDateString('ar-DZ')}
                  </div>
                </div>
              )}
            </div>

            {parentInfo && (
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  معلومات ولي الأمر
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">الاسم</span>
                    </div>
                    <div className="text-lg font-bold">{parentInfo.parent?.full_name}</div>
                  </div>

                  {parentInfo.parent?.phone && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm font-medium">رقم الهاتف</span>
                      </div>
                      <div className="text-lg font-bold">{parentInfo.parent.phone}</div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">العلاقة</span>
                    </div>
                    <div className="text-lg font-bold">{parentInfo.relationship || "ولي أمر"}</div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={handleContactParent}
                    className="w-full"
                    size="lg"
                  >
                    <MessageSquare className="ml-2 h-5 w-5" />
                    التواصل مع ولي الأمر
                  </Button>
                </div>
              </div>
            )}

            {!parentInfo && (
              <div className="pt-6 border-t">
                <div className="text-center text-muted-foreground">
                  لا توجد معلومات متاحة عن ولي الأمر
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};