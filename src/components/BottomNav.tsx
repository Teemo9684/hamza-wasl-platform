import { Home, Calendar, BookOpen, MessageSquare, Send, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

interface BottomNavProps {
  items: NavItem[];
  activeSection?: string;
}

export const BottomNav = ({ items, activeSection }: BottomNavProps) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
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
