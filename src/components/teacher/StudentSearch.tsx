import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, MessageSquare, User, Phone, Calendar, IdCard, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendMessageNotification } from "@/utils/sendPushNotification";
import { lightHaptic, successHaptic, errorHaptic } from "@/utils/haptics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StudentSearchProps {
  students: any[];
  onSendMessage: (parentId: string, studentId: string) => void;
}

export const StudentSearch = ({ students, onSendMessage }: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [parentInfo, setParentInfo] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const filteredStudents = students.filter((student) =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.national_school_id.includes(searchQuery)
  );

  const handleStudentSelect = async (student: any) => {
    setSelectedStudent(student);
    setSearchQuery("");
    setShowResults(false);
    lightHaptic();

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

  const handleOpenMessageDialog = () => {
    if (parentInfo && selectedStudent) {
      setMessageSubject(`بخصوص التلميذ: ${selectedStudent.full_name}`);
      setMessageContent("");
      setShowMessageDialog(true);
      lightHaptic();
    }
  };

  const handleSendMessage = async () => {
    if (!messageSubject.trim() || !messageContent.trim()) {
      errorHaptic();
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    if (!parentInfo || !selectedStudent) return;

    setSending(true);
    lightHaptic();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      // Get teacher name
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Insert message
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: parentInfo.parent_id,
          subject: messageSubject,
          content: messageContent,
          student_id: selectedStudent.id,
        });

      if (insertError) throw insertError;

      // Send push notification
      await sendMessageNotification(
        [parentInfo.parent_id],
        teacherProfile?.full_name || 'معلم',
        messageSubject
      );

      successHaptic();
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة بنجاح إلى ولي الأمر",
      });

      setShowMessageDialog(false);
      setMessageSubject("");
      setMessageContent("");
    } catch (error: any) {
      errorHaptic();
      toast({
        title: "خطأ",
        description: error.message || "فشل إرسال الرسالة",
        variant: "destructive",
      });
    } finally {
      setSending(false);
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
              placeholder="ابحث باسم التلميذ أو الرقم المدرسي..."
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
                  <span className="text-sm font-medium">الرقم المدرسي</span>
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
                    {new Date(selectedStudent.date_of_birth).toLocaleDateString('ar-u-nu-latn')}
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
                    onClick={handleOpenMessageDialog}
                    className="w-full"
                    size="lg"
                  >
                    <MessageSquare className="ml-2 h-5 w-5" />
                    إرسال رسالة لولي الأمر
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

      {/* Dialog for sending message */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              إرسال رسالة لولي الأمر
            </DialogTitle>
            <DialogDescription>
              إرسال رسالة إلى {parentInfo?.parent?.full_name} بخصوص {selectedStudent?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">الموضوع</Label>
              <Input
                id="subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="موضوع الرسالة"
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">محتوى الرسالة</Label>
              <Textarea
                id="content"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                rows={5}
                disabled={sending}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMessageDialog(false)}
              disabled={sending}
            >
              إلغاء
            </Button>
            <Button onClick={handleSendMessage} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="ml-2 h-4 w-4" />
                  إرسال
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};