import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, Send, Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDateOnly } from "@/utils/formatters";
import { sendNewDocumentRequestNotification } from "@/utils/sendPushNotification";
import { realtimeManager } from "@/utils/realtimeManager";

interface ParentDocumentRequestsProps {
  selectedChild: string;
  children: any[];
}

const documentTypes = [
  { value: "شهادة مدرسية", label: "شهادة مدرسية" },
  { value: "كشف نقاط", label: "كشف نقاط" },
  { value: "وثيقة أخرى", label: "وثيقة أخرى" },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500", icon: Clock },
  approved: { label: "تمت الموافقة", color: "bg-blue-500", icon: CheckCircle },
  ready: { label: "جاهزة للاستلام", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "bg-red-500", icon: XCircle },
};

export const ParentDocumentRequests = ({ selectedChild, children }: ParentDocumentRequestsProps) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(selectedChild);

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select(`
          *,
          student:students(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error("خطأ في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    
    // Subscribe to realtime updates using realtimeManager for instant updates
    const handleDocumentChange = (payload: any) => {
      console.log('Document request change received in ParentDocumentRequests:', payload);
      // Immediately refetch on any change
      fetchRequests();
    };

    const cleanup = realtimeManager.subscribe(
      'parent-document-requests-list',
      'document_requests',
      handleDocumentChange
    );

    return () => {
      cleanup();
    };
  }, [fetchRequests]);

  useEffect(() => {
    setSelectedStudent(selectedChild);
  }, [selectedChild]);

  const handleSubmit = async () => {
    if (!selectedStudent || !documentType) {
      toast.error("الرجاء اختيار التلميذ ونوع الوثيقة");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مصرح");

      // Get parent name for notification
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Get student name for notification
      const student = children.find(c => c.id === selectedStudent);
      const studentName = student?.full_name || 'التلميذ';

      const { error } = await supabase
        .from('document_requests')
        .insert({
          parent_id: user.id,
          student_id: selectedStudent,
          document_type: documentType,
          notes: notes || null,
        });

      if (error) throw error;

      // Send notification to admins
      await sendNewDocumentRequestNotification(
        documentType,
        studentName,
        parentProfile?.full_name || 'ولي الأمر'
      );

      toast.success("تم إرسال طلب الوثيقة بنجاح");
      setDocumentType("");
      setNotes("");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || "خطأ في إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('document_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success("تم حذف الطلب بنجاح");
      fetchRequests();
    } catch (error: any) {
      toast.error("فشل في حذف الطلب");
    }
  };

  const selectedChildData = children.find(c => c.id === selectedStudent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          طلب وثائق إدارية
        </CardTitle>
        <CardDescription>
          يمكنك طلب وثائق إدارية مثل شهادة مدرسية أو شهادة انتقال وغيرها
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Request Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold text-lg">طلب وثيقة جديدة</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">التلميذ</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التلميذ" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">نوع الوثيقة</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الوثيقة" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ملاحظات (اختياري)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف أي ملاحظات إضافية..."
              className="resize-none"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !selectedStudent || !documentType}
            className="w-full md:w-auto"
          >
            {submitting ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="ml-2 h-4 w-4" />
            )}
            إرسال الطلب
          </Button>
        </div>

        {/* Previous Requests */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">طلباتي السابقة</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              لا توجد طلبات سابقة
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const status = statusConfig[request.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={request.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{request.document_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.student?.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString("ar-u-nu-latn", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        {request.admin_notes && (
                          <p className="text-sm text-primary mt-1">
                            رد الإدارة: {request.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={`${status.color} text-white flex items-center gap-1 w-fit`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الطلب</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteRequest(request.id)}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
