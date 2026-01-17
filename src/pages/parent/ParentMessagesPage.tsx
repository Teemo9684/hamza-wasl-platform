import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { ParentMessages } from "@/components/parent/ParentMessages";
import { useParentDashboard } from "@/components/ParentDashboardLayout";
import { realtimeManager } from "@/utils/realtimeManager";
import { setAppBadge } from "@/utils/appBadge";
import { playNotificationSound } from "@/utils/pushNotifications";
import { mediumHaptic } from "@/utils/haptics";
import { useNotifications } from "@/contexts/NotificationContext";

export const ParentMessagesContent = () => {
  const { toast } = useToast();
  const { children } = useParentDashboard();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { refreshCounts } = useNotifications();

  useEffect(() => {
    fetchParentData();
  }, []);

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
      if (!user) return;

      setCurrentUserId(user.id);

      const { data: childrenData } = await supabase
        .from('students')
        .select(`
          *,
          parent_students!inner(parent_id)
        `)
        .eq('parent_students.parent_id', user.id);

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
    }
  };

  return (
    <ParentMessages
      teachers={teachers}
      receivedMessages={receivedMessages}
      children={children}
      onMessageSent={fetchParentData}
    />
  );
};

export default ParentMessagesContent;
