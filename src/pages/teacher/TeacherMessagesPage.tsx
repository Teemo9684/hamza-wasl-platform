import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TeacherMessages } from "@/components/teacher/TeacherMessages";
import { messageSchema } from "@/lib/validations";
import { sendMessageNotification } from "@/utils/sendPushNotification";
import { useNotifications } from "@/contexts/NotificationContext";
import { showError, showSuccess } from "@/utils/errorMessages";
import { setAppBadge } from "@/utils/appBadge";
import { clearAllDeliveredNotifications } from "@/utils/localNotifications";

export const TeacherMessagesContent = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("");
  
  const { clearSection } = useNotifications();

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    clearSection('messages');
  }, [clearSection]);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
      showError(error);
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
      
      // Recalculate unread count and update app badge immediately
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);
        
        // Update app badge with new count
        setAppBadge(count || 0);
        
        // Clear notifications from status bar
        await clearAllDeliveredNotifications();
      }
      
      fetchTeacherData();
    } catch (error: any) {
      showError(error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      showSuccess("تم الحذف", "تم حذف الرسالة بنجاح");
      
      fetchTeacherData();
    } catch (error: any) {
      showError(error);
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

      showSuccess("تم الإرسال", "تم إرسال الرد بنجاح");

      await handleMarkAsRead(messageId);
      fetchTeacherData();
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
