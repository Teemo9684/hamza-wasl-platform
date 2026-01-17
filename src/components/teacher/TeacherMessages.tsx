import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Mail, MailOpen, Reply, User, Trash2, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

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
  const [expandedSenders, setExpandedSenders] = useState<string[]>([]);

  // Filter messages based on status
  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "unread") return !message.is_read;
      if (filterStatus === "read") return message.is_read;
      return true;
    });
  }, [messages, filterStatus]);

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
      
      // Update last message date if this message is newer
      if (new Date(message.created_at) > new Date(groups[senderId].lastMessageDate)) {
        groups[senderId].lastMessageDate = message.created_at;
      }
    });
    
    // Sort groups by last message date (newest first)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-u-nu-latn', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">الرسائل والاستفسارات</h2>
          <p className="text-muted-foreground text-sm">تواصل مع أولياء الأمور • {groupedMessages.length} محادثة</p>
        </div>
        <Select value={filterStatus} onValueChange={(value: "all" | "unread" | "read") => setFilterStatus(value)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="تصفية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل ({messages.length})</SelectItem>
            <SelectItem value="unread">جديد ({messages.filter(m => !m.is_read).length})</SelectItem>
            <SelectItem value="read">مقروءة ({messages.filter(m => m.is_read).length})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {groupedMessages.length > 0 ? (
        <Accordion 
          type="multiple" 
          value={expandedSenders}
          onValueChange={setExpandedSenders}
          className="space-y-3"
        >
          {groupedMessages.map((group) => (
            <AccordionItem 
              key={group.senderId} 
              value={group.senderId}
              className="border rounded-xl overflow-hidden bg-card shadow-sm"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/30">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    {group.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {group.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="font-semibold text-base">{group.senderName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {group.messages.length} رسالة • آخر رسالة: {formatDate(group.lastMessageDate)}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y">
                    {group.messages
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((message) => {
                        const isReply = message.subject?.startsWith('رد:');
                        
                        return (
                          <div 
                            key={message.id} 
                            className={`p-4 transition-colors ${!message.is_read ? 'bg-primary/5' : 'bg-background'}`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                {message.is_read ? (
                                  <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                  <Mail className="h-4 w-4 text-primary shrink-0" />
                                )}
                                <span className="font-medium text-sm line-clamp-1">{message.subject}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!message.is_read ? (
                                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs px-2 py-0">جديد</Badge>
                                ) : isReply ? (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-0">رد</Badge>
                                ) : null}
                                <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
                              </div>
                            </div>
                            
                            <div className="bg-muted/40 p-3 rounded-lg mb-3">
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            </div>
                            
                            {message.student && (
                              <p className="text-xs text-muted-foreground mb-3">
                                بخصوص الطالب: <span className="font-medium text-foreground">{message.student.full_name}</span>
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleOpenReply(message)}
                                className="gap-1.5 h-8 text-xs"
                              >
                                <Reply className="h-3.5 w-3.5" />
                                رد
                              </Button>
                              {!message.is_read && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onMarkAsRead(message.id)}
                                  className="h-8 text-xs"
                                >
                                  تعليم كمقروءة
                                </Button>
                              )}
                              {onDeleteMessage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(message.id)}
                                  className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد رسائل حالياً</p>
          </CardContent>
        </Card>
      )}

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الرد على الرسالة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">إلى: {replyMessage.recipientName}</p>
              <p className="text-sm text-muted-foreground">الموضوع: رد: {replyMessage.originalSubject}</p>
            </div>
            <Textarea
              value={replyMessage.content}
              onChange={(e) => setReplyMessage({ ...replyMessage, content: e.target.value })}
              placeholder="اكتب ردك هنا..."
              rows={6}
            />
            <Button onClick={handleSendReply} className="w-full" disabled={!replyMessage.content.trim()}>
              إرسال الرد
            </Button>
          </div>
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
