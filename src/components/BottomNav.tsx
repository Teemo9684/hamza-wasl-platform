import { Home, Calendar, BookOpen, MessageSquare, Send, FileText, Clock, Users, GraduationCap, Megaphone, Settings, BarChart3, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

interface NotificationCounts {
  [key: string]: number;
}

interface BottomNavProps {
  items: NavItem[];
  activeSection?: string;
  onNavigate?: (sectionId: string) => void;
  notifications?: NotificationCounts;
}

export const BottomNav = ({ items, activeSection, onNavigate, notifications = {} }: BottomNavProps) => {
  const handleClick = (sectionId: string) => {
    if (onNavigate) {
      onNavigate(sectionId);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const notificationCount = notifications[item.id] || 0;
          
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                {notificationCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] animate-pulse"
                  >
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium font-cairo truncate max-w-[60px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// Pre-defined nav items for teacher dashboard
export const teacherNavItems: NavItem[] = [
  { id: "overview", icon: Home, label: "الرئيسية" },
  { id: "attendance", icon: Calendar, label: "الحضور" },
  { id: "homework", icon: BookOpen, label: "الواجبات" },
  { id: "messages", icon: MessageSquare, label: "الرسائل" },
  { id: "groupMessages", icon: Send, label: "جماعية" },
];

// Pre-defined nav items for parent dashboard
export const parentNavItems: NavItem[] = [
  { id: "overview", icon: Home, label: "الرئيسية" },
  { id: "attendance", icon: Calendar, label: "الحضور" },
  { id: "homework", icon: BookOpen, label: "الواجبات" },
  { id: "schedule", icon: Clock, label: "الجدول" },
  { id: "messages", icon: MessageSquare, label: "الرسائل" },
  { id: "documents", icon: FileText, label: "الوثائق" },
];

// Pre-defined nav items for admin dashboard
export const adminNavItems: NavItem[] = [
  { id: "home", icon: Home, label: "الرئيسية" },
  { id: "users", icon: Users, label: "المستخدمين" },
  { id: "students", icon: GraduationCap, label: "التلاميذ" },
  { id: "news", icon: Megaphone, label: "الأخبار" },
  { id: "reports", icon: BarChart3, label: "التقارير" },
];
