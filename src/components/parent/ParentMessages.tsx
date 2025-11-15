import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ParentMessagesProps {
  teachers: any[];
  receivedMessages: any[];
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
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast({
        title: "تنبيه",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
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

      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال رسالتك بنجاح",
      });

      setNewMessage({ recipient_id: "", subject: "", content: "", student_id: "" });
      onMessageSent();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleViewMessage = async (message: any) => {
    setSelectedMessage(message);
    setIsMessageDialogOpen(true);

    if (!message.is_read) {
      await handleMarkAsRead(message.id);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      onMessageSent();
    } catch (error: any) {
      console.error("Error marking message as read:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">المراسلة</h2>
          <p className="text-muted-foreground">التواصل مع المعلمين</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              رسالة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>إرسال رسالة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>المعلم</Label>
                <Select
                  value={newMessage.recipient_id}
                  onValueChange={(value) =>
                    setNewMessage({ ...newMessage, recipient_id: value })
                  }
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
                  onValueChange={(value) =>
                    setNewMessage({ ...newMessage, student_id: value })
                  }
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
                  onChange={(e) =>
                    setNewMessage({ ...newMessage, subject: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>الرسالة</Label>
                <Textarea
                  placeholder="اكتب رسالتك هنا..."
                  value={newMessage.content}
                  onChange={(e) =>
                    setNewMessage({ ...newMessage, content: e.target.value })
                  }
                  rows={5}
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={isSending}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {isSending ? "جاري الإرسال..." : "إرسال الرسالة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            الرسائل الواردة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receivedMessages.length > 0 ? (
            <div className="space-y-3">
              {receivedMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{message.subject}</span>
                      {!message.is_read && (
                        <Badge variant="default" className="text-xs">جديد</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleDateString('ar-DZ')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    من: {message.sender?.full_name}
                  </p>
                  {message.student && (
                    <p className="text-xs text-muted-foreground mt-1">
                      خاص بالطالب: {message.student.full_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد رسائل</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  من: {selectedMessage.sender?.full_name}
                </span>
                <span className="text-muted-foreground">
                  {new Date(selectedMessage.created_at).toLocaleDateString('ar-DZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {selectedMessage.student && (
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    خاص بالطالب: {selectedMessage.student.full_name}
                  </span>
                </div>
              )}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
