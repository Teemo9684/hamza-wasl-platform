import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherMessages } from "@/components/teacher/TeacherMessages";
import { messageSchema } from "@/lib/validations";
import { sendMessageNotification } from "@/utils/sendPushNotification";
import { useNotifications } from "@/contexts/NotificationContext";
import { showError, showSuccess } from "@/utils/errorMessages";
import { setAppBadge } from "@/utils/appBadge";
import { clearAllDeliveredNotifications } from "@/utils/localNotifications";
import { realtimeManager } from "@/utils/realtimeManager";

export const TeacherMessagesContent = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const { clearSection, refreshCounts } = useNotifications();

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    clearSection('messages');
  }, [clearSection]);

  // Setup realtime subscription for messages
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
        refreshCounts();
        return;
      }

      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as any;
        
        // Skip if sent by current user
        if (newMessage.sender_id === currentUserId) return;
        
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
        
        refreshCounts();
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
        refreshCounts();
      }

      if (payload.eventType === 'DELETE') {
        const deletedMessage = payload.old as any;
        if (deletedMessage?.id) {
          setMessages(prev => {
            const updated = prev.filter(m => m.id !== deletedMessage.id);
            const unreadCount = updated.filter(m => !m.is_read).length;
            setAppBadge(unreadCount);
            return updated;
          });
          refreshCounts();
        }
      }
    };

    const cleanup = realtimeManager.subscribe(
      `teacher-messages-${currentUserId}`,
      'messages',
      handleMessageChange,
      `recipient_id=eq.${currentUserId}`
    );

    return () => cleanup();
  }, [currentUserId, refreshCounts]);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
      
      // Update badge with initial count
      const unreadCount = (messagesData || []).filter(m => !m.is_read).length;
      setAppBadge(unreadCount);
    } catch (error: any) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    // Optimistic update
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      );
      const unreadCount = updated.filter(m => !m.is_read).length;
      setAppBadge(unreadCount);
      return updated;
    });
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      
      // Clear notifications from status bar
      await clearAllDeliveredNotifications();
      
      refreshCounts();
    } catch (error: any) {
      showError(error);
      // Revert on error
      fetchTeacherData();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Optimistic update - remove immediately from UI
    setMessages(prev => {
      const updated = prev.filter(m => m.id !== messageId);
      const unreadCount = updated.filter(m => !m.is_read).length;
      setAppBadge(unreadCount);
      return updated;
    });
    
    // Update notification context
    refreshCounts();
    
    // Clear status bar notifications
    await clearAllDeliveredNotifications();
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      showSuccess("تم الحذف", "تم حذف الرسالة بنجاح");
    } catch (error: any) {
      showError(error);
      // Revert on error
      fetchTeacherData();
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

      // Get student name for notification
      let studentName: string | undefined;
      if (studentId) {
        const { data: studentData } = await supabase
          .from('students')
          .select('full_name')
          .eq('id', studentId)
          .single();
        studentName = studentData?.full_name;
      }

      await sendMessageNotification(
        [recipientId],
        teacherName || 'معلم',
        `رد: ${originalSubject}`,
        studentName
      );

      showSuccess("تم الإرسال", "تم إرسال الرد بنجاح");

      await handleMarkAsRead(messageId);
    } catch (error: any) {
      showError(error.errors?.[0]?.message || error);
    }
  };

  return (
    <TeacherMessages
      messages={messages}
      onMarkAsRead={handleMarkAsRead}
      onSendReply={handleSendReply}
      onDeleteMessage={handleDeleteMessage}
    />
  );
};

export default TeacherMessagesContent;
