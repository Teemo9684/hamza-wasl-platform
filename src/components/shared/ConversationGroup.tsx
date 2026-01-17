import { useState } from "react";
import { ChevronDown, User, MessageSquare, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCard } from "./MessageCard";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Message {
  id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  student_id?: string | null;
  sender?: { full_name: string };
  student?: { full_name: string };
}

interface ConversationGroupProps {
  id: string;
  name: string;
  avatar?: string;
  messages: Message[];
  unreadCount: number;
  lastMessageDate: string;
  defaultOpen?: boolean;
  onReply?: (message: Message) => void;
  onMarkAsRead?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onDeleteAll?: () => void;
}

export const ConversationGroup = ({
  id,
  name,
  avatar,
  messages,
  unreadCount,
  lastMessageDate,
  defaultOpen = false,
  onReply,
  onMarkAsRead,
  onDelete,
  onDeleteAll,
}: ConversationGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    
    return date.toLocaleDateString('ar-u-nu-latn', {
      month: 'short',
      day: 'numeric',
    });
  };

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "rounded-2xl border bg-card overflow-hidden transition-all duration-200",
        isOpen ? "shadow-md" : "shadow-sm hover:shadow-md",
        unreadCount > 0 && !isOpen && "border-primary/30"
      )}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-right">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                unreadCount > 0 
                  ? "bg-gradient-to-br from-primary to-primary/70" 
                  : "bg-muted"
              )}>
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className={cn(
                    "h-6 w-6",
                    unreadCount > 0 ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                )}
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                  {unreadCount > 9 ? '+9' : unreadCount}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className={cn(
                  "font-semibold truncate",
                  unreadCount > 0 ? "text-foreground" : "text-foreground/80"
                )}>
                  {name}
                </h3>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeDate(lastMessageDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {messages.length} رسالة
                </span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {unreadCount} جديدة
                  </Badge>
                )}
              </div>
            </div>

            {/* Chevron */}
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t">
            {/* Actions header */}
            {onDeleteAll && messages.length > 1 && (
              <div className="px-4 py-2 bg-muted/20 border-b flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {messages.length} رسالة في هذه المحادثة
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDeleteAll}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 ml-1" />
                  حذف الكل
                </Button>
              </div>
            )}

            {/* Messages list */}
            <ScrollArea className="max-h-[400px]">
              <div className="p-3 space-y-2">
                {sortedMessages.map((message) => (
                  <MessageCard
                    key={message.id}
                    id={message.id}
                    subject={message.subject}
                    content={message.content}
                    senderName={message.sender?.full_name || 'غير معروف'}
                    studentName={message.student?.full_name}
                    createdAt={message.created_at}
                    isRead={message.is_read}
                    isReply={message.subject?.startsWith('رد:')}
                    onReply={onReply ? () => onReply(message) : undefined}
                    onMarkAsRead={onMarkAsRead ? () => onMarkAsRead(message.id) : undefined}
                    onDelete={onDelete ? () => onDelete(message.id) : undefined}
                    compact
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
