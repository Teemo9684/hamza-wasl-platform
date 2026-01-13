import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Hash, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { lightHaptic, successHaptic, errorHaptic } from "@/utils/haptics";

interface AddChildDialogProps {
  onChildAdded: () => void;
}

export const AddChildDialog = ({ onChildAdded }: AddChildDialogProps) => {
  const [open, setOpen] = useState(false);
  const [nationalSchoolId, setNationalSchoolId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nationalSchoolId.trim()) {
      errorHaptic();
      toast.error("يرجى إدخال الرقم الوطني المدرسي");
      return;
    }

    setLoading(true);
    lightHaptic();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      // Check if student exists using RPC function
      const { data: studentData, error: studentError } = await supabase
        .rpc('check_student_exists', { _national_school_id: nationalSchoolId.trim() });

      if (studentError || !studentData || studentData.length === 0) {
        errorHaptic();
        toast.error(`لم يتم العثور على تلميذ بالرقم الوطني "${nationalSchoolId}". يرجى التأكد من أن التلميذ مسجل في النظام.`);
        return;
      }

      const student = studentData[0];

      // Check if already linked
      const { data: existingLink } = await supabase
        .from('parent_students')
        .select('id')
        .eq('parent_id', user.id)
        .eq('student_id', student.student_id)
        .maybeSingle();

      if (existingLink) {
        errorHaptic();
        toast.error(`التلميذ "${student.student_name}" مرتبط بحسابك بالفعل`);
        return;
      }

      // Link parent to student
      const { error: linkError } = await supabase.rpc('link_parent_to_student', {
        _parent_id: user.id,
        _national_school_id: nationalSchoolId.trim(),
      });

      if (linkError) {
        throw linkError;
      }

      successHaptic();
      toast.success(`تم ربط التلميذ "${student.student_name}" بحسابك بنجاح`);
      setNationalSchoolId("");
      setOpen(false);
      onChildAdded();
    } catch (error: any) {
      errorHaptic();
      toast.error(error.message || "حدث خطأ أثناء إضافة الابن");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => lightHaptic()}
        >
          <UserPlus className="h-4 w-4" />
          إضافة ابن
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة ابن جديد</DialogTitle>
          <DialogDescription className="text-right">
            أدخل الرقم الوطني المدرسي للتلميذ لربطه بحسابك
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nationalSchoolId">الرقم الوطني المدرسي</Label>
              <div className="relative">
                <Hash className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nationalSchoolId"
                  type="text"
                  placeholder="أدخل الرقم الوطني المدرسي (16 رقم)"
                  value={nationalSchoolId}
                  onChange={(e) => setNationalSchoolId(e.target.value)}
                  className="pr-10"
                  dir="ltr"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                يجب أن يكون التلميذ مسجلاً مسبقاً من قبل الإدارة
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                "إضافة"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
