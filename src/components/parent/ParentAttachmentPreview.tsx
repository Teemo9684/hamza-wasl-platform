import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Capacitor } from "@capacitor/core";
import { ExternalLink, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParentAttachmentPreviewProps {
  url: string | null;
  label: string;
  onClose: () => void;
}

const classifyFile = (url: string) => {
  // Ignore signed-url parameters when checking file extensions.
  const pathname = (() => {
    try { return new URL(url).pathname.toLowerCase(); }
    catch { return url.split("?")[0].toLowerCase(); }
  })();
  if (/\.(png|jpe?g|webp|gif|bmp|avif)$/.test(pathname)) return "image";
  if (/\.pdf$/.test(pathname)) return "pdf";
  return "other";
};

/** Parents-only fullscreen viewer: never competes with the fixed news/date header. */
export const ParentAttachmentPreview = ({ url, label, onClose }: ParentAttachmentPreviewProps) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!url) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [url, onClose]);

  if (!url) return null;
  const kind = classifyFile(url);
  const native = Capacitor.isNativePlatform();
  const safeArea = native
    ? { paddingTop: "max(24px, env(safe-area-inset-top, 0px))", paddingBottom: "max(24px, env(safe-area-inset-bottom, 0px))" }
    : undefined;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[100] flex flex-col bg-background text-foreground"
      style={safeArea}
      dir="rtl"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-background px-4 py-3 shadow-sm">
        <div className="min-w-0 flex items-center gap-2">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <h2 className="truncate text-base font-bold font-cairo">{label}</h2>
        </div>
        <Button ref={closeRef} variant="outline" size="sm" onClick={onClose} aria-label="إغلاق معاينة المرفق">
          <X className="h-4 w-4 ml-1" />
          إغلاق
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-2">
        {kind === "image" ? (
          <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
        ) : kind === "pdf" ? (
          <iframe
            src={url}
            title={label}
            className="h-full w-full rounded-md border-0 bg-background"
          />
        ) : (
          <div className="max-w-md space-y-3 p-6 text-center font-cairo">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p>هذا النوع من الملفات قد لا يدعم المعاينة داخل التطبيق.</p>
            <p className="text-sm text-muted-foreground">يمكنك فتح المرفق باستخدام تطبيق مناسب على هاتفك.</p>
          </div>
        )}
      </div>
      <div className="flex shrink-0 justify-center border-t bg-background p-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-cairo text-primary-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          فتح المرفق خارج المعاينة
        </a>
      </div>
    </div>,
    document.body
  );
};
