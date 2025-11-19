import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PendingApproval {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  role: "admin" | "teacher" | "parent" | null;
}

export const AccountApprovalsManager = () => {
  const queryClient = useQueryClient();
  const [loadingApproval, setLoadingApproval] = useState<string | null>(null);

  const { data: pendingApprovals, isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_approvals");
      if (error) throw error;
      return data as PendingApproval[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      setLoadingApproval(userId);
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("تم اعتماد الحساب بنجاح");
      setLoadingApproval(null);
    },
    onError: (error) => {
      console.error("Error approving account:", error);
      toast.error("حدث خطأ أثناء اعتماد الحساب");
      setLoadingApproval(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      setLoadingApproval(userId);
      // Delete user from auth.users which will cascade delete from profiles and user_roles
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("تم رفض الحساب وحذفه");
      setLoadingApproval(null);
    },
    onError: (error) => {
      console.error("Error rejecting account:", error);
      toast.error("حدث خطأ أثناء رفض الحساب");
      setLoadingApproval(null);
    },
  });

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    
    const roleLabels: Record<string, string> = {
      admin: "إداري",
      teacher: "معلم",
      parent: "ولي أمر",
    };

    const roleColors: Record<string, string> = {
      admin: "bg-red-500",
      teacher: "bg-blue-500",
      parent: "bg-green-500",
    };

    return (
      <Badge className={`${roleColors[role]} text-white`}>
        {roleLabels[role]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">الحسابات قيد الانتظار</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            الحسابات قيد الانتظار
          </div>
          {pendingApprovals && pendingApprovals.length > 0 && (
            <Badge variant="secondary">
              {pendingApprovals.length} طلب
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!pendingApprovals || pendingApprovals.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد طلبات موافقة في الوقت الحالي</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((approval) => (
              <Card key={approval.id} className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 text-right">
                      <h3 className="font-semibold text-lg mb-2">
                        {approval.full_name}
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {approval.phone && (
                          <p className="flex items-center justify-end gap-2">
                            <span>{approval.phone}</span>
                            <span>:الهاتف</span>
                          </p>
                        )}
                        <p className="flex items-center justify-end gap-2">
                          <span>
                            {format(new Date(approval.created_at), "PPP", { locale: ar })}
                          </span>
                          <span>:تاريخ التسجيل</span>
                        </p>
                        {approval.role && (
                          <div className="flex items-center justify-end gap-2">
                            {getRoleBadge(approval.role)}
                            <span>:الصفة</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end md:justify-start">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveMutation.mutate(approval.id)}
                        disabled={loadingApproval === approval.id}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        اعتماد
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(approval.id)}
                        disabled={loadingApproval === approval.id}
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        رفض
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
