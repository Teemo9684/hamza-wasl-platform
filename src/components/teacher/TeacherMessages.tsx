import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { MessagesHeader } from "@/components/shared/MessagesHeader";
import { ConversationGroup } from "@/components/shared/ConversationGroup";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
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

interface TeacherMessagesProps {
  messages: Message[];
  onMarkAsRead: (messageId: string) => Promise<void>;
  onSendReply: (messageId: string, recipientId: string, originalSubject: string, studentId: string, content: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
}

export const TeacherMessages = ({
  messages,
  onMarkAsRead,
  onSendReply,
  onDeleteMessage,
}: TeacherMessagesProps) => {
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState({
    messageId: "",
    recipientId: "",
    recipientName: "",
    originalSubject: "",
    studentId: "",
    content: "",
  });
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter messages based on status and search
  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesStatus = filterStatus === "all" 
        || (filterStatus === "unread" && !message.is_read)
        || (filterStatus === "read" && message.is_read);
      
      const matchesSearch = !searchQuery 
        || message.subject.toLowerCase().includes(searchQuery.toLowerCase())
        || message.content.toLowerCase().includes(searchQuery.toLowerCase())
        || message.sender?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [messages, filterStatus, searchQuery]);

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

  const handleOpenReply = (message: Message) => {
    setReplyMessage({
      messageId: message.id,
      recipientId: message.sender_id,
      recipientName: message.sender?.full_name || 'غير معروف',
      originalSubject: message.subject,
      studentId: message.student_id || "",
      content: "",
    });
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    await onSendReply(
      replyMessage.messageId,
      replyMessage.recipientId,
      replyMessage.originalSubject,
      replyMessage.studentId,
      replyMessage.content
    );
    setIsReplyDialogOpen(false);
    setReplyMessage({
      messageId: "",
      recipientId: "",
      recipientName: "",
      originalSubject: "",
      studentId: "",
      content: "",
    });
  };

  const handleDeleteClick = (messageId: string) => {
    setMessageToDelete(messageId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (messageToDelete && onDeleteMessage) {
      await onDeleteMessage(messageToDelete);
    }
    setIsDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const totalUnread = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6">
      <MessagesHeader
        title="الرسائل والاستفسارات"
        subtitle="تواصل مع أولياء الأمور"
        totalCount={messages.length}
        unreadCount={totalUnread}
        conversationCount={groupedMessages.length}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch
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
              onReply={handleOpenReply}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDeleteMessage ? handleDeleteClick : undefined}
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

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>الرد على الرسالة</DialogTitle>
            <DialogDescription>
              إلى: {replyMessage.recipientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">الموضوع: </span>
              <span className="font-medium">رد: {replyMessage.originalSubject}</span>
            </div>
            <Textarea
              value={replyMessage.content}
              onChange={(e) => setReplyMessage({ ...replyMessage, content: e.target.value })}
              placeholder="اكتب ردك هنا..."
              rows={6}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSendReply} disabled={!replyMessage.content.trim()}>
              إرسال الرد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف الرسالة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
