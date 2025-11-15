import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, MailOpen, Reply } from "lucide-react";
import { useState } from "react";

interface TeacherMessagesProps {
  messages: any[];
  onMarkAsRead: (messageId: string) => Promise<void>;
  onSendReply: (messageId: string, recipientId: string, originalSubject: string, studentId: string, content: string) => Promise<void>;
}

export const TeacherMessages = ({
  messages,
  onMarkAsRead,
  onSendReply,
}: TeacherMessagesProps) => {
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState({
    messageId: "",
    recipientId: "",
    recipientName: "",
    originalSubject: "",
    studentId: "",
    content: "",
  });

  const handleOpenReply = (message: any) => {
    setReplyMessage({
      messageId: message.id,
      recipientId: message.sender_id,
      recipientName: message.sender?.full_name || 'غير معروف',
      originalSubject: message.subject,
      studentId: message.student_id,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">الرسائل والاستفسارات</h2>
        <p className="text-muted-foreground">تواصل مع أولياء الأمور</p>
      </div>

      {messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className={`hover:shadow-md transition-shadow ${!message.is_read ? 'border-primary/30' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {message.is_read ? (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Mail className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{message.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        من: {message.sender?.full_name || 'غير معروف'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!message.is_read && (
                      <Badge variant="default">جديد</Badge>
                    )}
                    <Badge variant="outline">
                      {new Date(message.created_at).toLocaleDateString('ar-DZ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.student && (
                  <div className="text-sm text-muted-foreground">
                    بخصوص الطالب: <span className="font-medium text-foreground">{message.student.full_name}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenReply(message)}
                    className="gap-2"
                  >
                    <Reply className="h-4 w-4" />
                    رد
                  </Button>
                  {!message.is_read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkAsRead(message.id)}
                    >
                      تعليم كمقروءة
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد رسائل حالياً</p>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
};
