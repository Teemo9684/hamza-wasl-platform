import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { AlertTriangle, XCircle, CheckCircle2, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      dir="rtl"
      icons={{
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:gap-3",
          title: "group-[.toast]:font-bold group-[.toast]:text-base",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:leading-relaxed",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:font-medium",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          error: "group-[.toaster]:border-red-500/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-red-500/10 group-[.toaster]:to-background/95",
          success: "group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-emerald-500/10 group-[.toaster]:to-background/95",
          warning: "group-[.toaster]:border-amber-500/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-amber-500/10 group-[.toaster]:to-background/95",
          info: "group-[.toaster]:border-blue-500/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-blue-500/10 group-[.toaster]:to-background/95",
        },
        duration: 5000,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
