import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { ParentMessages } from "@/components/parent/ParentMessages";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";
import { AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/AnimatedSection";
import { BottomNav, parentNavItems } from "@/components/BottomNav";
import { realtimeManager } from "@/utils/realtimeManager";
import { setAppBadge } from "@/utils/appBadge";
import { playNotificationSound } from "@/utils/pushNotifications";
import { mediumHaptic } from "@/utils/haptics";
import { useNotifications } from "@/contexts/NotificationContext";

const ParentMessagesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasNews, tickerHeight } = useNewsTicker();
  const [children, setChildren] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { counts, clearSection, setUserId, setChildIds, setUserRole, refreshCounts } = useNotifications();

  useEffect(() => {
    fetchParentData();
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
          setReceivedMessages(messagesData);
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

        setReceivedMessages(prev => {
          const updated = [enrichedMessage, ...prev];
          const unreadCount = updated.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
          return updated;
        });
        
        playNotificationSound('message');
        mediumHaptic();
        sonnerToast.success("رسالة جديدة", {
          description: senderData?.full_name || 'رسالة جديدة من المعلم',
        });
        
        refreshCounts();
      }

      if (payload.eventType === 'UPDATE') {
        const updatedMessage = payload.new as any;
        setReceivedMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          );
          const unreadCount = updated.filter(m => !m.is_read).length;
          setAppBadge(unreadCount);
          return updated;
        });
        refreshCounts();
      }
    };

    const cleanup = realtimeManager.subscribe(
      `parent-messages-${currentUserId}`,
      'messages',
      handleMessageChange,
      `recipient_id=eq.${currentUserId}`
    );

    return () => cleanup();
  }, [currentUserId, refreshCounts]);

  const fetchParentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login/parent");
        return;
      }

      setCurrentUserId(user.id);
      setUserId(user.id);

      const { data: childrenData, error: childrenError } = await supabase
        .from('students')
        .select(`
          *,
          parent_students!inner(parent_id)
        `)
        .eq('parent_students.parent_id', user.id);

      if (childrenError) throw childrenError;
      setChildren(childrenData || []);
      
      if (childrenData && childrenData.length > 0) {
        setChildIds(childrenData.map(c => c.id));
      }

      const { data: teachersData, error: teachersError } = await supabase
        .from('teacher_students')
        .select(`
          teacher_id,
          subject,
          profiles!teacher_students_teacher_id_fkey(id, full_name)
        `)
        .in('student_id', childrenData?.map(c => c.id) || []);

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

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
      setReceivedMessages(messagesData || []);
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

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'messages') {
      return; // Already here
    }
    if (sectionId === 'attendance') {
      clearSection('attendance');
    } else if (sectionId === 'homework') {
      clearSection('homework');
    }
    if (sectionId === 'overview') {
      navigate('/dashboard/parent');
    } else {
      navigate(`/dashboard/parent/${sectionId}`);
    }
  };

  const unreadMessagesCount = receivedMessages.filter(m => !m.is_read).length;

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
              onClick={() => navigate('/dashboard/parent')}
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
          <AnimatedSection key="parent-messages">
            <div className="max-w-6xl mx-auto w-full">
              <ParentMessages
                teachers={teachers}
                receivedMessages={receivedMessages}
                children={children}
                onMessageSent={fetchParentData}
              />
            </div>
          </AnimatedSection>
        </AnimatePresence>
      </main>

      <BottomNav 
        items={parentNavItems} 
        activeSection="messages"
        onNavigate={handleNavigate}
        useHashNavigation={false}
        notifications={{
          messages: unreadMessagesCount,
          attendance: counts.attendance,
          homework: counts.homework,
        }}
      />
    </div>
  );
};

export default ParentMessagesPage;
