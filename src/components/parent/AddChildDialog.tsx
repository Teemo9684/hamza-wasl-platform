import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, ShieldCheck } from "lucide-react";

/**
 * Adding an additional child to an already-approved parent is an
 * administrative identity-verification action. Never link by a school
 * ID alone; the database blocks that operation for approved parents.
 */
interface AddChildDialogProps { onChildAdded: () => void; }
export const AddChildDialog = (_props: AddChildDialogProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          إضافة ابن
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> إضافة ابن بأمان
          </DialogTitle>
          <DialogDescription className="text-right leading-7">
            لحماية بيانات التلاميذ، يجب أن تتحقق إدارة المدرسة من صلة القرابة قبل إضافة
            ابن آخر إلى حساب ولي الأمر. يرجى التواصل مع الإدارة وطلب ربط التلميذ
            بحسابك. لن تُعرض بياناته في التطبيق قبل إتمام الاعتماد.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => setOpen(false)}>فهمت</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
