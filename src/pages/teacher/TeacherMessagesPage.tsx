import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TeacherMessages } from "@/components/teacher/TeacherMessages";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { BottomNav, teacherNavItems } from "@/components/BottomNav";
import { messageSchema } from "@/lib/validations";
import { sendMessageNotification } from "@/utils/sendPushNotification";
import { useNotifications } from "@/contexts/NotificationContext";
import ContentTransition from "@/components/ContentTransition";

const TeacherMessagesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("");
  
  const { counts, setUserId, setUserRole, clearSection, refreshCounts } = useNotifications();

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Clear messages notification when visiting this page
  useEffect(() => {
    clearSection('messages');
  }, [clearSection]);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/teacher");
        return;
      }

      setCurrentUserId(user.id);
      
      // Set up notification context
      setUserId(user.id);
      setUserRole('teacher');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setTeacherName(profileData?.full_name || "المعلم");

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name),
          student:students(full_name)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      fetchTeacherData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الرسالة بنجاح",
      });
      
      fetchTeacherData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendReply = async (
    messageId: string,
    recipientId: string,
    originalSubject: string,
    studentId: string,
    content: string
  ) => {
    try {
      messageSchema.parse({
        subject: `رد: ${originalSubject}`,
        content: content,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          subject: `رد: ${originalSubject}`,
          content: content,
          student_id: studentId,
        });

      if (error) throw error;

      await sendMessageNotification(
        [recipientId],
        teacherName || 'معلم',
        `رد: ${originalSubject}`
      );

      toast({
        title: "تم بنجاح",
        description: "تم إرسال الرد بنجاح",
      });

      await handleMarkAsRead(messageId);
      fetchTeacherData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.errors?.[0]?.message || error.message,
        variant: "destructive",
      });
    }
  };

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'overview') {
      navigate('/dashboard/teacher');
    } else {
      navigate(`/dashboard/teacher/${sectionId}`);
    }
  };

  // No loading spinner - content renders immediately

  const headerHeight = 56;

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-clip pt-[env(safe-area-inset-top)]">
      {hasNews && (
        <div className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-50">
          <NewsTicker />
        </div>
      )}
      
      <div 
        className="fixed left-0 right-0 z-40 bg-background/98 backdrop-blur-xl border-b shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        style={{ top: `calc(env(safe-area-inset-top) + ${hasNews ? tickerHeight : 0}px)` }}
      >
        <header>
          <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/teacher')}
              className="font-cairo h-10 px-3 text-sm active:scale-95 touch-feedback"
              size="sm"
            >
              <ArrowRight className="ml-1.5 h-4 w-4" />
              رجوع
            </Button>
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-sm md:text-lg font-bold truncate leading-tight">الرسائل</h1>
            </div>
            <div className="w-20"></div>
          </div>
        </header>
      </div>

      <div style={{ height: (hasNews ? tickerHeight : 0) + headerHeight }} />

      <main className="flex-1 p-3 md:p-4 pb-24 w-full">
        <ContentTransition>
          <div className="max-w-6xl mx-auto w-full">
            <TeacherMessages
              messages={messages}
              onMarkAsRead={handleMarkAsRead}
              onSendReply={handleSendReply}
              onDeleteMessage={handleDeleteMessage}
            />
          </div>
        </ContentTransition>
      </main>

      <BottomNav 
        items={teacherNavItems} 
        activeSection="messages"
        onNavigate={handleNavigate}
        useHashNavigation={false}
        notifications={{
          messages: counts.messages,
        }}
      />
    </div>
  );
};

export default TeacherMessagesPage;
