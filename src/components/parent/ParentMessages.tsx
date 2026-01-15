import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Mail, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { messageSchema } from "@/lib/validations";
import { formatDateOnly, formatDateTime } from "@/utils/formatters";
import { sendMessageNotification } from "@/utils/sendPushNotification";

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
      // Validate message content
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

      // Get sender name for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Send push notification to recipient
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

  const handleDeleteMessage = async (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الرسالة بنجاح",
      });
      onMessageSent();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الرسالة",
        variant: "destructive",
      });
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
              {receivedMessages.map((message) => {
                const isReply = message.subject?.startsWith('رد:');
                
                return (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${!message.is_read ? 'border-primary/30 bg-primary/5' : ''}`}
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{message.subject}</span>
                      {!message.is_read ? (
                        <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">جديد</Badge>
                      ) : isReply ? (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">رد</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">مقروءة</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString('ar-u-nu-latn')}
                      </span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
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
                              onClick={(e) => handleDeleteMessage(message.id, e)}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
                );
              })}
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
                  {new Date(selectedMessage.created_at).toLocaleDateString('ar-u-nu-latn', {
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
