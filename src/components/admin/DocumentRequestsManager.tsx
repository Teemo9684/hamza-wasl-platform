import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, Loader2, User, Calendar, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDateTime } from "@/utils/formatters";
import { sendDocumentStatusNotification } from "@/utils/sendPushNotification";
import { realtimeManager } from "@/utils/realtimeManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500", icon: Clock },
  approved: { label: "تمت الموافقة", color: "bg-blue-500", icon: CheckCircle },
  ready: { label: "جاهزة للاستلام", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "مرفوض", color: "bg-red-500", icon: XCircle },
};

const statusOptions = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "approved", label: "تمت الموافقة" },
  { value: "ready", label: "جاهزة للاستلام" },
  { value: "rejected", label: "مرفوض" },
];

export const DocumentRequestsManager = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select(`
          *,
          student:students(full_name, grade_level),
          parent:profiles!document_requests_parent_id_fkey(full_name, phone)
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
      console.log('DocumentRequestsManager: Update received', payload);
      fetchRequests();
      if (payload.eventType !== 'REFRESH') {
        toast.info("تم تحديث طلبات الوثائق");
      }
    };

    const cleanup = realtimeManager.subscribe(
      'admin-document-requests-manager',
      'document_requests',
      handleDocumentChange
    );

    return () => {
      cleanup();
    };
  }, [fetchRequests]);


  const handleStatusChange = async (requestId: string, newStatus: string) => {
    setUpdatingId(requestId);
    try {
      // Get request details for notification
      const request = requests.find(r => r.id === requestId);
      
      const { error } = await supabase
        .from('document_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      // Send notification to parent
      if (request) {
        await sendDocumentStatusNotification(
          request.parent_id,
          request.document_type,
          newStatus,
          request.student?.full_name
        );
      }

      toast.success("تم تحديث حالة الطلب");
      fetchRequests();
    } catch (error: any) {
      toast.error("خطأ في تحديث الحالة");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdminNotes = async (requestId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('document_requests')
        .update({ admin_notes: notes })
        .eq('id', requestId);

      if (error) throw error;
      toast.success("تم حفظ الملاحظات");
    } catch (error: any) {
      toast.error("خطأ في حفظ الملاحظات");
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
      toast.error("خطأ في حذف الطلب");
    }
  };

  const filteredRequests = filterStatus === "all" 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            طلبات الوثائق الإدارية
          </h2>
          <p className="text-muted-foreground">
            إدارة طلبات الوثائق من أولياء الأمور
          </p>
        </div>

        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {pendingCount} طلب جديد
            </Badge>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الطلبات</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            لا توجد طلبات وثائق
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const status = statusConfig[request.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <Card key={request.id} className={`hover:shadow-md transition-shadow ${request.status === 'pending' ? 'border-primary/30 bg-primary/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg">{request.document_type}</h3>
                            <Badge className={`${status.color} text-white flex items-center gap-1`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                            {request.status === 'pending' && (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs">
                                جديد
                              </Badge>
                            )}
                            {request.admin_notes && request.status !== 'pending' && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                                تم الرد
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              التلميذ: <span className="font-medium text-foreground">{request.student?.full_name}</span>
                              <span className="text-xs">({request.student?.grade_level})</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              ولي الأمر: <span className="font-medium text-foreground">{request.parent?.full_name}</span>
                              {request.parent?.phone && (
                                <span className="text-xs">({request.parent.phone})</span>
                              )}
                            </p>
                            <p className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              تاريخ الطلب: {formatDateTime(request.created_at)}
                            </p>
                          </div>

                          {request.notes && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <span className="font-medium">ملاحظات الولي:</span> {request.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px]">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">تغيير الحالة</label>
                        <Select
                          value={request.status}
                          onValueChange={(value) => handleStatusChange(request.id, value)}
                          disabled={updatingId === request.id}
                        >
                          <SelectTrigger>
                            {updatingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">رد الإدارة</label>
                        <Textarea
                          defaultValue={request.admin_notes || ""}
                          placeholder="أضف ردك هنا..."
                          className="resize-none text-sm"
                          rows={2}
                          onBlur={(e) => {
                            if (e.target.value !== request.admin_notes) {
                              handleAdminNotes(request.id, e.target.value);
                            }
                          }}
                        />
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف الطلب
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد حذف الطلب</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف طلب الوثيقة "{request.document_type}" للتلميذ {request.student?.full_name}؟
                              <br />
                              هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRequest(request.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
