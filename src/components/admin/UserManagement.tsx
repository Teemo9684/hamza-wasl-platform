import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, Search, Shield, Trash2, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  role?: string;
}

interface PendingApproval {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  role: "admin" | "teacher" | "parent" | null;
}

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"teachers" | "parents" | "pending">("teachers");
  const [loading, setLoading] = useState(true);
  const [loadingApproval, setLoadingApproval] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab !== "pending") {
      fetchUsers();
    }
  }, [activeTab]);

  const { data: pendingApprovals, isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_approvals");
      if (error) throw error;
      return data as PendingApproval[];
    },
    enabled: activeTab === "pending",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get users with their roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", activeTab === "teachers" ? "teacher" : "parent");

      if (rolesError) throw rolesError;

      const userIds = userRoles?.map(ur => ur.user_id) || [];

      if (userIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: userRoles?.find(ur => ur.user_id === profile.id)?.role
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل المستخدمين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "نجاح",
        description: "تم حذف المستخدم بنجاح",
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حذف المستخدم",
        variant: "destructive",
      });
    }
  };

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
      sonnerToast.success("تم اعتماد الحساب بنجاح");
      setLoadingApproval(null);
    },
    onError: (error) => {
      console.error("Error approving account:", error);
      sonnerToast.error("حدث خطأ أثناء اعتماد الحساب");
      setLoadingApproval(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      setLoadingApproval(userId);
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      sonnerToast.success("تم رفض الحساب وحذفه");
      setLoadingApproval(null);
    },
    onError: (error) => {
      console.error("Error rejecting account:", error);
      sonnerToast.error("حدث خطأ أثناء رفض الحساب");
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

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-cairo">إدارة المستخدمين</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "teachers" ? "default" : "outline"}
          onClick={() => setActiveTab("teachers")}
          className="font-cairo"
        >
          <UserCheck className="ml-2 h-4 w-4" />
          المعلمين
        </Button>
        <Button
          variant={activeTab === "parents" ? "default" : "outline"}
          onClick={() => setActiveTab("parents")}
          className="font-cairo"
        >
          <Users className="ml-2 h-4 w-4" />
          أولياء الأمور
        </Button>
        <div className="relative">
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            onClick={() => setActiveTab("pending")}
            className="font-cairo"
          >
            <Clock className="ml-2 h-4 w-4" />
            الحسابات المعلقة
          </Button>
          {pendingApprovals && pendingApprovals.length > 0 && (
            <Badge className="absolute -top-2 -left-2 bg-red-500 text-white h-5 min-w-5 flex items-center justify-center px-1.5">
              {pendingApprovals.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Search - Only show for non-pending tabs */}
      {activeTab !== "pending" && (
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن مستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 font-cairo"
          />
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === "pending" ? (
        // Pending Approvals View
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-right flex items-center justify-between font-cairo">
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
            {pendingLoading ? (
              <div className="text-center py-8 text-muted-foreground font-cairo">
                جاري التحميل...
              </div>
            ) : !pendingApprovals || pendingApprovals.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground font-cairo">لا توجد طلبات موافقة في الوقت الحالي</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <Card key={approval.id} className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 text-right">
                          <h3 className="font-semibold text-lg mb-2 font-cairo">
                            {approval.full_name}
                          </h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {approval.phone && (
                              <p className="flex items-center justify-end gap-2 font-cairo">
                                <span>{approval.phone}</span>
                                <span>:الهاتف</span>
                              </p>
                            )}
                            <p className="flex items-center justify-end gap-2 font-cairo">
                              <span>
                                {format(new Date(approval.created_at), "PPP", { locale: ar })}
                              </span>
                              <span>:تاريخ التسجيل</span>
                            </p>
                            {approval.role && (
                              <div className="flex items-center justify-end gap-2">
                                {getRoleBadge(approval.role)}
                                <span className="font-cairo">:الصفة</span>
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
                            className="gap-2 font-cairo"
                          >
                            <CheckCircle className="w-4 h-4" />
                            اعتماد
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(approval.id)}
                            disabled={loadingApproval === approval.id}
                            className="gap-2 font-cairo"
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
      ) : (
        // Users Table for Teachers and Parents
        <>
          {/* Users Table */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-cairo">
                {activeTab === "teachers" ? "قائمة المعلمين" : "قائمة أولياء الأمور"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground font-cairo">
                  جاري التحميل...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-cairo">
                  لا توجد بيانات
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-cairo">الاسم الكامل</TableHead>
                      <TableHead className="font-cairo">رقم الهاتف</TableHead>
                      <TableHead className="font-cairo">تاريخ التسجيل</TableHead>
                      <TableHead className="font-cairo">الحالة</TableHead>
                      <TableHead className="font-cairo">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-tajawal font-medium">
                          {user.full_name}
                        </TableCell>
                        <TableCell className="font-tajawal">
                          {user.phone || "غير متوفر"}
                        </TableCell>
                        <TableCell className="font-tajawal">
                          {new Date(user.created_at).toLocaleDateString("ar-EG")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-cairo">
                            <CheckCircle className="ml-1 h-3 w-3" />
                            نشط
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive font-cairo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="font-cairo">
                                  تأكيد الحذف
                                </DialogTitle>
                                <DialogDescription className="font-cairo">
                                  هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="font-cairo"
                                >
                                  حذف
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <Users className="w-5 h-5 text-primary" />
                  إجمالي المستخدمين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{users.length}</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  المستخدمين النشطين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{users.length}</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo text-lg">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  المستخدمين المعطلين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
