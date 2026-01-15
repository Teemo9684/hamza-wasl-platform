import { useEffect, useState, useRef } from "react";
import { Home, Calendar, BookOpen, MessageSquare, Send, FileText, Clock, Users, GraduationCap, Megaphone, Settings, BarChart3, Shield, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { lightHaptic } from "@/utils/haptics";

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
  useHashNavigation?: boolean;
  scrollable?: boolean; // تفعيل السحب الأفقي
}

export const BottomNav = ({ items, activeSection, onNavigate, notifications = {}, useHashNavigation = true, scrollable = false }: BottomNavProps) => {
  const [currentSection, setCurrentSection] = useState<string>(activeSection || items[0]?.id || "");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // تتبع القسم الحالي من الـ hash
  useEffect(() => {
    if (!useHashNavigation) return;
    
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && items.some(item => item.id === hash)) {
        setCurrentSection(hash);
      }
    };
    
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && items.some(item => item.id === initialHash)) {
      setCurrentSection(initialHash);
      setTimeout(() => {
        const element = document.getElementById(initialHash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [items, useHashNavigation]);

  // تحديث القسم من الـ prop
  useEffect(() => {
    if (activeSection) {
      setCurrentSection(activeSection);
    }
  }, [activeSection]);

  // التمرير للعنصر النشط
  useEffect(() => {
    if (scrollable && scrollContainerRef.current && currentSection) {
      const activeElement = scrollContainerRef.current.querySelector(`[data-section="${currentSection}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentSection, scrollable]);

  const handleClick = (sectionId: string) => {
    if (isDragging) return;
    
    lightHaptic();
    
    if (onNavigate) {
      onNavigate(sectionId);
    } else {
      if (useHashNavigation && sectionId !== currentSection) {
        window.history.pushState(null, '', `#${sectionId}`);
      }
      
      setCurrentSection(sectionId);
      
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // معالجة السحب بالماوس
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollable || !scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // معالجة السحب باللمس
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollable || !scrollContainerRef.current) return;
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/98 backdrop-blur-xl border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
      {scrollable ? (
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-1 h-[72px] px-2 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            const notificationCount = notifications[item.id] || 0;
            
            return (
              <button
                key={item.id}
                data-section={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] min-h-[56px] flex-shrink-0 active:scale-95 touch-feedback select-none",
                  isActive 
                    ? "bg-primary/15 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  {notificationCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold animate-pulse border-2 border-background shadow-md"
                    >
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold font-cairo whitespace-nowrap transition-colors",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-4 h-0.5 rounded-full bg-primary/60" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-around h-[72px] px-1 max-w-lg mx-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            const notificationCount = notifications[item.id] || 0;
            
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 px-2 py-2 rounded-2xl transition-all duration-200 min-w-[56px] min-h-[56px] active:scale-95 touch-feedback",
                  isActive 
                    ? "bg-primary/15 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-6 w-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  {notificationCount > 0 && (
                    <Badge 
                      className="absolute -top-2.5 -right-2.5 h-5 min-w-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[11px] font-bold animate-pulse border-2 border-background shadow-md"
                    >
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-semibold font-cairo truncate max-w-[56px] transition-colors",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-1 w-5 h-1 rounded-full bg-primary/60" />
                )}
              </button>
            );
          })}
        </div>
      )}
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
  { id: "settings", icon: Settings, label: "الإعدادات" },
];

// Pre-defined nav items for admin dashboard - جميع الأقسام
export const adminNavItems: NavItem[] = [
  { id: "home", icon: Home, label: "الرئيسية" },
  { id: "users", icon: Users, label: "المستخدمين" },
  { id: "students", icon: GraduationCap, label: "التلاميذ" },
  { id: "news", icon: Megaphone, label: "الأخبار" },
  { id: "announcements", icon: Megaphone, label: "الإعلانات" },
  { id: "messages", icon: MessageSquare, label: "الرسائل" },
  { id: "groupMessages", icon: Send, label: "جماعية" },
  { id: "schedule", icon: Calendar, label: "الجدول" },
  { id: "documentRequests", icon: FileText, label: "الوثائق" },
  { id: "posters", icon: Image, label: "الملصقات" },
  { id: "reports", icon: BarChart3, label: "التقارير" },
  { id: "settings", icon: Settings, label: "الإعدادات" },
];
