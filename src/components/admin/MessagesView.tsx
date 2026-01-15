import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { MessageSquare, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/utils/formatters";

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
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all");

  const handleMessagesChange = useCallback(() => {
    fetchAllMessages();
  }, []);

  // Real-time subscription for messages
  useRealtime({
    table: 'messages',
    onChange: handleMessagesChange,
  });

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

  const formatDateDisplay = (dateString: string) => {
    return formatDateTime(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground font-cairo">جاري تحميل الرسائل...</p>
      </div>
    );
  }

  // Calculate total messages for filter counts
  const allMessages = messagesByTeacher.flatMap(t => t.messages);
  const unreadMessages = allMessages.filter(m => !m.is_read);
  const readMessages = allMessages.filter(m => m.is_read);

  // Filter messages in each teacher group
  const filteredTeachers = messagesByTeacher.map(teacher => ({
    ...teacher,
    messages: teacher.messages.filter(message => {
      if (filterStatus === "all") return true;
      if (filterStatus === "unread") return !message.is_read;
      if (filterStatus === "read") return message.is_read;
      return true;
    })
  })).filter(teacher => teacher.messages.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold font-cairo">إدارة الرسائل والاستفسارات</h2>
            <p className="text-muted-foreground font-cairo">عرض جميع الرسائل بين الأولياء والأساتذة</p>
          </div>
        </div>
        <Select value={filterStatus} onValueChange={(value: "all" | "unread" | "read") => setFilterStatus(value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="تصفية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل ({allMessages.length})</SelectItem>
            <SelectItem value="unread">جديد ({unreadMessages.length})</SelectItem>
            <SelectItem value="read">مقروءة ({readMessages.length})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTeachers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground font-cairo">لا توجد رسائل حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {filteredTeachers.map((teacher) => (
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
                      {teacher.messages.map((message) => {
                        const isReply = message.subject?.startsWith('رد:');
                        
                        return (
                        <Card key={message.id} className={!message.is_read ? "border-primary/50 bg-primary/5" : ""}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-cairo">{message.subject}</CardTitle>
                              <div className="flex items-center gap-1">
                                {!message.is_read ? (
                                  <Badge variant="destructive" className="text-xs bg-green-500 hover:bg-green-600">
                                    جديد
                                  </Badge>
                                ) : isReply ? (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    رد
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    مقروءة
                                  </Badge>
                                )}
                              </div>
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
                              {formatDateDisplay(message.created_at)}
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}
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
