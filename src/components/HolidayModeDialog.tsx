import { Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HolidayModeDialogProps {
  open: boolean;
  message: string;
}

export const HolidayModeDialog = ({ open, message }: HolidayModeDialogProps) => {
  return (
    <Dialog open={open} modal>
      <DialogContent 
        className="sm:max-w-md font-cairo"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <Calendar className="w-12 h-12 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-orange-600 dark:text-orange-400">
            وضع العطلة
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-cairo pt-4 text-foreground">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <p className="text-sm text-muted-foreground font-cairo">
            يرجى العودة لاحقاً
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};