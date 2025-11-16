import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, Search, Shield, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"teachers" | "parents">("teachers");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

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
      <div className="flex gap-2">
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
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث عن مستخدم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 font-cairo"
        />
      </div>

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
    </div>
  );
};
