import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Message {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_name: string;
  recipient_name: string;
  student_name: string;
}

interface TeacherMessages {
  teacher_id: string;
  teacher_name: string;
  messages: Message[];
}

export const MessagesView = () => {
  const [messagesByTeacher, setMessagesByTeacher] = useState<TeacherMessages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllMessages();
  }, []);

  const fetchAllMessages = async () => {
    try {
      setLoading(true);

      // Fetch all messages with sender and recipient profiles
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          id,
          subject,
          content,
          created_at,
          is_read,
          sender_id,
          recipient_id,
          student_id,
          sender:profiles!messages_sender_id_fkey(full_name),
          recipient:profiles!messages_recipient_id_fkey(full_name),
          student:students(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get all teacher user IDs
      const { data: teacherRoles, error: teacherError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      if (teacherError) throw teacherError;

      const teacherIds = teacherRoles?.map((r) => r.user_id) || [];

      // Get teacher profiles
      const { data: teacherProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", teacherIds);

      if (profileError) throw profileError;

      // Group messages by teacher
      const groupedMessages: { [key: string]: TeacherMessages } = {};

      messages?.forEach((msg: any) => {
        const teacherId = teacherIds.includes(msg.sender_id) 
          ? msg.sender_id 
          : teacherIds.includes(msg.recipient_id) 
          ? msg.recipient_id 
          : null;

        if (teacherId) {
          const teacherProfile = teacherProfiles?.find(p => p.id === teacherId);
          const teacherName = teacherProfile?.full_name || "معلم غير معروف";

          if (!groupedMessages[teacherId]) {
            groupedMessages[teacherId] = {
              teacher_id: teacherId,
              teacher_name: teacherName,
              messages: [],
            };
          }

          groupedMessages[teacherId].messages.push({
            id: msg.id,
            subject: msg.subject,
            content: msg.content,
            created_at: msg.created_at,
            is_read: msg.is_read,
            sender_name: msg.sender?.full_name || "غير معروف",
            recipient_name: msg.recipient?.full_name || "غير معروف",
            student_name: msg.student?.full_name || "غير محدد",
          });
        }
      });

      const teachersArray = Object.values(groupedMessages);
      setMessagesByTeacher(teachersArray);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching messages:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground font-cairo">جاري تحميل الرسائل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold font-cairo">إدارة الرسائل والاستفسارات</h2>
          <p className="text-muted-foreground font-cairo">عرض جميع الرسائل بين الأولياء والأساتذة</p>
        </div>
      </div>

      {messagesByTeacher.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground font-cairo">لا توجد رسائل حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {messagesByTeacher.map((teacher) => (
            <AccordionItem key={teacher.teacher_id} value={teacher.teacher_id} className="border-none">
              <Card>
                <AccordionTrigger className="hover:no-underline px-6 py-4">
                  <div className="flex items-center gap-3 w-full">
                    <User className="w-5 h-5 text-primary" />
                    <div className="flex-1 text-right">
                      <h3 className="text-lg font-bold font-cairo">{teacher.teacher_name}</h3>
                      <p className="text-sm text-muted-foreground font-cairo">
                        {teacher.messages.length} رسالة
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {teacher.messages.filter(m => !m.is_read).length} غير مقروءة
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[500px] px-6 pb-4">
                    <div className="space-y-3">
                      {teacher.messages.map((message) => (
                        <Card key={message.id} className={!message.is_read ? "border-primary/50" : ""}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-cairo">{message.subject}</CardTitle>
                              {!message.is_read && (
                                <Badge variant="destructive" className="text-xs">
                                  جديد
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground font-cairo">
                              <span>من: {message.sender_name}</span>
                              <span>•</span>
                              <span>إلى: {message.recipient_name}</span>
                              {message.student_name && (
                                <>
                                  <span>•</span>
                                  <span>الطالب: {message.student_name}</span>
                                </>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-sm mb-3 font-cairo">{message.content}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-cairo">
                              <Clock className="w-3 h-3" />
                              {formatDate(message.created_at)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};
