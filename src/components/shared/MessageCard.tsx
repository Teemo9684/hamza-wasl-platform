import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Reply, Trash2, Clock, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageCardProps {
  id: string;
  subject: string;
  content: string;
  senderName: string;
  studentName?: string;
  createdAt: string;
  isRead: boolean;
  isReply?: boolean;
  onReply?: () => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export const MessageCard = ({
  id,
  subject,
  content,
  senderName,
  studentName,
  createdAt,
  isRead,
  isReply,
  onReply,
  onMarkAsRead,
  onDelete,
  showActions = true,
  compact = false,
}: MessageCardProps) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-u-nu-latn', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    
    return date.toLocaleDateString('ar-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border transition-all duration-200",
        !isRead 
          ? "bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/30 shadow-sm" 
          : "bg-card hover:bg-muted/30 border-border",
        compact ? "p-3" : "p-4"
      )}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            "shrink-0 rounded-full flex items-center justify-center",
            !isRead ? "bg-primary/10" : "bg-muted",
            compact ? "w-9 h-9" : "w-11 h-11"
          )}>
            {isRead ? (
              <MailOpen className={cn("text-muted-foreground", compact ? "h-4 w-4" : "h-5 w-5")} />
            ) : (
              <Mail className={cn("text-primary", compact ? "h-4 w-4" : "h-5 w-5")} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-semibold text-foreground truncate",
              compact ? "text-sm" : "text-base"
            )}>
              {subject}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
                {senderName}
              </span>
              {studentName && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
                    {studentName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isRead ? (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-2 py-0.5 font-medium">
              جديد
            </Badge>
          ) : isReply ? (
            <Badge variant="secondary" className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-[10px] px-2 py-0.5">
              رد
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "bg-muted/40 rounded-lg mb-3",
        compact ? "p-2.5" : "p-3"
      )}>
        <p className={cn(
          "text-foreground/90 whitespace-pre-wrap leading-relaxed line-clamp-3",
          compact ? "text-xs" : "text-sm"
        )}>
          {content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs">
            {formatDate(createdAt)} • {formatTime(createdAt)}
          </span>
        </div>

        {showActions && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="h-7 px-2 text-xs gap-1 hover:bg-primary/10 hover:text-primary"
              >
                <Reply className="h-3.5 w-3.5" />
                رد
              </Button>
            )}
            {!isRead && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAsRead}
                className="h-7 px-2 text-xs hover:bg-muted"
              >
                تعليم كمقروءة
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
