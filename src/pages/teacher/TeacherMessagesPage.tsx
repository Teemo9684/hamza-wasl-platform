import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { TeacherMessages } from "@/components/teacher/TeacherMessages";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { BottomNav, teacherNavItems } from "@/components/BottomNav";
import { messageSchema } from "@/lib/validations";
import { sendMessageNotification } from "@/utils/sendPushNotification";
import { realtimeManager } from "@/utils/realtimeManager";
import { setAppBadge } from "@/utils/appBadge";
import { playNotificationSound } from "@/utils/pushNotifications";

const TeacherMessagesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Real-time subscription for messages
  useEffect(() => {
    if (!currentUserId) return;

    const handleMessageChange = async (payload: any) => {
      if (payload.eventType === 'REFRESH') {
        const { data: messagesData } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(full_name),
            student:students(full_name)
          `)
          .eq('recipient_id', currentUserId)
          .order('created_at', { ascending: false });
        
        if (messagesData) {
          setMessages(messagesData);
          const unreadCount = messagesData.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
        }
        return;
      }

      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as any;
        
        const { data: senderData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', newMessage.sender_id)
          .single();
        
        let studentData = null;
        if (newMessage.student_id) {
          const { data } = await supabase
            .from('students')
            .select('full_name')
            .eq('id', newMessage.student_id)
            .single();
          studentData = data;
        }

        const enrichedMessage = {
          ...newMessage,
          sender: senderData,
          student: studentData
        };

        setMessages(prev => {
          const updated = [enrichedMessage, ...prev];
          const unreadCount = updated.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
          return updated;
        });
        
        playNotificationSound('message');
        sonnerToast.success("رسالة جديدة", {
          description: senderData?.full_name || 'رسالة جديدة من ولي أمر',
        });
      }

      if (payload.eventType === 'UPDATE') {
        const updatedMessage = payload.new as any;
        setMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          );
          const unreadCount = updated.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
          return updated;
        });
      }
    };

    const cleanup = realtimeManager.subscribe(
      `teacher-messages-${currentUserId}`,
      'messages',
      handleMessageChange,
      `recipient_id=eq.${currentUserId}`
    );

    return () => cleanup();
  }, [currentUserId]);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/teacher");
        return;
      }

      setCurrentUserId(user.id);

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

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        <AnimatePresence mode="wait">
          <AnimatedSection key="teacher-messages">
            <div className="max-w-6xl mx-auto w-full">
              <TeacherMessages
                messages={messages}
                onMarkAsRead={handleMarkAsRead}
                onSendReply={handleSendReply}
              />
            </div>
          </AnimatedSection>
        </AnimatePresence>
      </main>

      <BottomNav 
        items={teacherNavItems} 
        activeSection="messages"
        onNavigate={handleNavigate}
        useHashNavigation={false}
        notifications={{
          messages: unreadCount,
        }}
      />
    </div>
  );
};

export default TeacherMessagesPage;
