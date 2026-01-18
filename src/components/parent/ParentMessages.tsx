import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { messageSchema } from "@/lib/validations";
import { sendMessageNotification } from "@/utils/sendPushNotification";
import { MessagesHeader } from "@/components/shared/MessagesHeader";
import { ConversationGroup } from "@/components/shared/ConversationGroup";
import { setAppBadge } from "@/utils/appBadge";
import { clearAllDeliveredNotifications } from "@/utils/localNotifications";

interface Message {
  id: string;
  sender_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  student_id: string | null;
  sender?: { full_name: string };
  student?: { full_name: string };
}

interface GroupedMessages {
  senderId: string;
  senderName: string;
  messages: Message[];
  unreadCount: number;
  lastMessageDate: string;
}

interface ParentMessagesProps {
  teachers: any[];
  receivedMessages: Message[];
  children: any[];
  onMessageSent: () => void;
}

export const ParentMessages = ({
  teachers,
  receivedMessages,
  children,
  onMessageSent,
}: ParentMessagesProps) => {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState({
    recipient_id: "",
    subject: "",
    content: "",
    student_id: "",
  });
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [viewMessage, setViewMessage] = useState<Message | null>(null);

  // Filter messages based on status and search
  const filteredMessages = useMemo(() => {
    return receivedMessages.filter((message) => {
      const matchesStatus = filterStatus === "all" 
        || (filterStatus === "unread" && !message.is_read)
        || (filterStatus === "read" && message.is_read);
      
      const matchesSearch = !searchQuery 
        || message.subject.toLowerCase().includes(searchQuery.toLowerCase())
        || message.content.toLowerCase().includes(searchQuery.toLowerCase())
        || message.sender?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [receivedMessages, filterStatus, searchQuery]);

  // Group messages by sender
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: GroupedMessages } = {};
    
    filteredMessages.forEach((message) => {
      const senderId = message.sender_id;
      const senderName = message.sender?.full_name || 'غير معروف';
      
      if (!groups[senderId]) {
        groups[senderId] = {
          senderId,
          senderName,
          messages: [],
          unreadCount: 0,
          lastMessageDate: message.created_at,
        };
      }
      
      groups[senderId].messages.push(message);
      if (!message.is_read) {
        groups[senderId].unreadCount++;
      }
      
      if (new Date(message.created_at) > new Date(groups[senderId].lastMessageDate)) {
        groups[senderId].lastMessageDate = message.created_at;
      }
    });
    
    return Object.values(groups).sort(
      (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
  }, [filteredMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.recipient_id) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار المعلم",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      messageSchema.parse({
        subject: newMessage.subject,
        content: newMessage.content,
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("المستخدم غير مسجل الدخول");

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: newMessage.recipient_id,
        subject: newMessage.subject,
        content: newMessage.content,
        student_id: newMessage.student_id || null,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      await sendMessageNotification(
        [newMessage.recipient_id],
        profile?.full_name || 'ولي أمر',
        newMessage.subject
      );

      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال رسالتك بنجاح",
      });

      setNewMessage({ recipient_id: "", subject: "", content: "", student_id: "" });
      setIsNewMessageOpen(false);
      onMessageSent();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.errors?.[0]?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
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
      
      onMessageSent();
    } catch (error: any) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', deleteMessageId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الرسالة بنجاح",
      });
      setDeleteMessageId(null);
      onMessageSent();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الرسالة",
        variant: "destructive",
      });
    }
  };

  const handleViewMessage = async (message: Message) => {
    setViewMessage(message);
    if (!message.is_read) {
      await handleMarkAsRead(message.id);
    }
  };

  const totalUnread = receivedMessages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6">
      <MessagesHeader
        title="المراسلة"
        subtitle="التواصل مع المعلمين"
        totalCount={receivedMessages.length}
        unreadCount={totalUnread}
        conversationCount={groupedMessages.length}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch
        actionButton={
          <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg">
                <Send className="h-4 w-4" />
                رسالة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إرسال رسالة جديدة</DialogTitle>
                <DialogDescription>
                  أرسل رسالة إلى أحد المعلمين
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>المعلم</Label>
                  <Select
                    value={newMessage.recipient_id}
                    onValueChange={(value) => setNewMessage({ ...newMessage, recipient_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المعلم" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher: any) => (
                        <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                          {teacher.profiles?.full_name} - {teacher.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الطالب (اختياري)</Label>
                  <Select
                    value={newMessage.student_id}
                    onValueChange={(value) => setNewMessage({ ...newMessage, student_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطالب" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child: any) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الموضوع</Label>
                  <Input
                    placeholder="موضوع الرسالة"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>الرسالة</Label>
                  <Textarea
                    placeholder="اكتب رسالتك هنا..."
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    rows={5}
                    className="resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSendMessage} disabled={isSending} className="gap-2">
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      إرسال
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {groupedMessages.length > 0 ? (
        <div className="space-y-3">
          {groupedMessages.map((group, index) => (
            <ConversationGroup
              key={group.senderId}
              id={group.senderId}
              name={group.senderName}
              messages={group.messages}
              unreadCount={group.unreadCount}
              lastMessageDate={group.lastMessageDate}
              defaultOpen={index === 0 && group.unreadCount > 0}
              onMarkAsRead={handleMarkAsRead}
              onDelete={(id) => setDeleteMessageId(id)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">لا توجد رسائل</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "ستظهر الرسائل الواردة هنا"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الرسالة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteMessage}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Message Dialog */}
      <Dialog open={!!viewMessage} onOpenChange={(open) => !open && setViewMessage(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{viewMessage?.subject}</DialogTitle>
          </DialogHeader>
          {viewMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>من: {viewMessage.sender?.full_name}</span>
                <span>
                  {new Date(viewMessage.created_at).toLocaleDateString('ar-u-nu-latn', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {viewMessage.student && (
                <div className="text-sm text-muted-foreground">
                  خاص بالطالب: {viewMessage.student.full_name}
                </div>
              )}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="whitespace-pre-wrap">{viewMessage.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
