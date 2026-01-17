import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Search, Filter, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessagesHeaderProps {
  title: string;
  subtitle?: string;
  totalCount: number;
  unreadCount: number;
  conversationCount?: number;
  filterStatus: "all" | "unread" | "read";
  onFilterChange: (value: "all" | "unread" | "read") => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  actionButton?: ReactNode;
  className?: string;
}

export const MessagesHeader = ({
  title,
  subtitle,
  totalCount,
  unreadCount,
  conversationCount,
  filterStatus,
  onFilterChange,
  searchQuery = "",
  onSearchChange,
  showSearch = false,
  actionButton,
  className,
}: MessagesHeaderProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Title section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {actionButton}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium">
          <MessageSquare className="h-3.5 w-3.5 ml-1.5" />
          {totalCount} رسالة
        </Badge>
        {unreadCount > 0 && (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-sm">
            {unreadCount} جديدة
          </Badge>
        )}
        {conversationCount !== undefined && (
          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
            {conversationCount} محادثة
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showSearch && onSearchChange && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الرسائل..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-10 h-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => onSearchChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <Select value={filterStatus} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px] h-10">
            <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
            <SelectValue placeholder="تصفية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center justify-between w-full gap-3">
                <span>الكل</span>
                <Badge variant="secondary" className="text-xs">{totalCount}</Badge>
              </div>
            </SelectItem>
            <SelectItem value="unread">
              <div className="flex items-center justify-between w-full gap-3">
                <span>جديدة</span>
                <Badge className="bg-emerald-500 text-xs">{unreadCount}</Badge>
              </div>
            </SelectItem>
            <SelectItem value="read">
              <div className="flex items-center justify-between w-full gap-3">
                <span>مقروءة</span>
                <Badge variant="outline" className="text-xs">{totalCount - unreadCount}</Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
