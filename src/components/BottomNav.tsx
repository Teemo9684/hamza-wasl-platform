import { useEffect, useState, useRef } from "react";
import { Home, Calendar, BookOpen, MessageSquare, Send, FileText, Clock, Users, GraduationCap, Megaphone, Settings, BarChart3, Image, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { lightHaptic } from "@/utils/haptics";
import { motion } from "framer-motion";

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
  scrollable?: boolean;
}

export const BottomNav = ({ 
  items, 
  activeSection, 
  onNavigate, 
  notifications = {}, 
  useHashNavigation = true, 
  scrollable = false 
}: BottomNavProps) => {
  const [currentSection, setCurrentSection] = useState<string>(activeSection || items[0]?.id || "");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentDotIndex, setCurrentDotIndex] = useState(0);
  const itemsPerView = 5;
  const totalDots = Math.ceil(items.length / itemsPerView);

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
        (activeElement as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentSection, scrollable]);

  // تتبع إمكانية التمرير وتحديث النقاط
  useEffect(() => {
    if (!scrollable || !scrollContainerRef.current) return;

    const checkScrollability = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const maxScroll = container.scrollWidth - container.clientWidth;
      const currentScroll = Math.abs(container.scrollLeft);
      
      // التعامل مع RTL - scrollLeft يكون سالباً في RTL
      const isRTL = getComputedStyle(container).direction === 'rtl';
      
      if (isRTL) {
        // في RTL، scrollLeft يبدأ من 0 ويصبح سالباً عند التمرير لليسار
        setCanScrollRight(currentScroll > 10);
        setCanScrollLeft(currentScroll < maxScroll - 10);
      } else {
        setCanScrollLeft(currentScroll > 10);
        setCanScrollRight(currentScroll < maxScroll - 10);
      }
      
      // حساب مؤشر النقطة الحالية بناءً على موقع التمرير
      if (maxScroll > 0) {
        const scrollPercentage = currentScroll / maxScroll;
        // في RTL، نعكس النسبة المئوية
        const adjustedPercentage = isRTL ? 1 - scrollPercentage : scrollPercentage;
        const dotIndex = Math.round(adjustedPercentage * (totalDots - 1));
        setCurrentDotIndex(Math.max(0, Math.min(dotIndex, totalDots - 1)));
      }
    };

    const container = scrollContainerRef.current;
    checkScrollability();
    
    container.addEventListener('scroll', checkScrollability);
    window.addEventListener('resize', checkScrollability);
    
    // Check after a short delay to ensure proper calculation
    setTimeout(checkScrollability, 100);
    setTimeout(checkScrollability, 500);
    
    return () => {
      container.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [scrollable, items, totalDots]);

  const handleClick = (sectionId: string) => {
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

  const scrollToDirection = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 150;
    scrollContainerRef.current.scrollBy({
      left: direction === 'right' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const scrollToDot = (dotIndex: number) => {
    if (!scrollContainerRef.current || totalDots <= 1) return;
    const container = scrollContainerRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const isRTL = getComputedStyle(container).direction === 'rtl';
    
    // حساب موقع التمرير المطلوب
    const targetPercentage = dotIndex / (totalDots - 1);
    // في RTL، نعكس الاتجاه
    const scrollPosition = isRTL 
      ? -maxScroll * (1 - targetPercentage)
      : maxScroll * targetPercentage;
    
    container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/98 backdrop-blur-xl border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:shadow-[0_-8px_30px_rgba(0,0,0,0.12)] safe-area-bottom">
      {scrollable ? (
        <div className="relative flex flex-col max-w-4xl mx-auto w-full">
          <div className="relative">
            {/* مؤشر التمرير لليسار */}
            {canScrollLeft && (
              <button
                onClick={() => scrollToDirection('left')}
                className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-background via-background/80 to-transparent"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground animate-pulse" />
              </button>
            )}
            
            {/* مؤشر التمرير لليمين */}
            {canScrollRight && (
              <button
                onClick={() => scrollToDirection('right')}
                className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-background via-background/80 to-transparent"
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground animate-pulse" />
              </button>
            )}
            
            <div 
              ref={scrollContainerRef}
              className="flex items-center justify-center gap-1.5 h-[72px] px-3 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                const notificationCount = notifications[item.id] || 0;
                
                return (
                  <motion.button
                    key={item.id}
                    data-section={item.id}
                    onClick={() => handleClick(item.id)}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-200 min-w-[72px] min-h-[60px] flex-shrink-0 active:scale-95 touch-feedback select-none",
                      isActive 
                        ? "bg-primary/15 text-primary shadow-md" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70"
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn(
                        "h-6 w-6 transition-all duration-200",
                        isActive && "drop-shadow-md"
                      )} />
                      {notificationCount > 0 && (
                        <Badge 
                          className="absolute -top-2.5 -right-2.5 h-5 min-w-5 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold animate-pulse border-2 border-background shadow-lg"
                        >
                          {notificationCount > 99 ? "99+" : notificationCount}
                        </Badge>
                      )}
                    </div>
                    <span className={cn(
                      "text-[11px] font-semibold font-cairo whitespace-nowrap transition-colors",
                      isActive && "text-primary font-bold"
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeIndicator"
                        className="absolute bottom-1.5 w-5 h-1 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
          
          {/* نقاط الموقع */}
          {totalDots > 1 && (
            <div className="flex items-center justify-center gap-1.5 pb-2 pt-1">
              {Array.from({ length: totalDots }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToDot(index)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    currentDotIndex === index 
                      ? "w-4 h-1.5 bg-primary" 
                      : "w-1.5 h-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[72px] px-2 w-full max-w-2xl mx-auto gap-1 md:gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            const notificationCount = notifications[item.id] || 0;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => handleClick(item.id)}
                animate={{
                  scale: isActive ? 1.08 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 px-2 py-2 rounded-xl transition-all duration-200 min-w-[52px] min-h-[56px] flex-1 max-w-[72px] md:max-w-[80px] md:min-w-[60px] active:scale-95 touch-feedback",
                  isActive 
                    ? "bg-primary/15 text-primary shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-6 w-6 transition-all duration-200",
                    isActive && "drop-shadow-md"
                  )} />
                  {notificationCount > 0 && (
                    <Badge 
                      className="absolute -top-2.5 -right-2.5 h-5 min-w-5 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold animate-pulse border-2 border-background shadow-lg"
                    >
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold font-cairo truncate w-full text-center transition-colors",
                  isActive && "text-primary font-bold"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicatorFixed"
                    className="absolute bottom-1 w-5 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
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
  { id: "documents", icon: FileText, label: "الوثائق" },
  { id: "messages", icon: MessageSquare, label: "الرسائل" },
  { id: "settings", icon: Settings, label: "الإعدادات" },
];

// Pre-defined nav items for admin dashboard - جميع الأقسام
export const adminNavItems: NavItem[] = [
  { id: "home", icon: Home, label: "الرئيسية" },
  { id: "users", icon: Users, label: "المستخدمين" },
  { id: "students", icon: GraduationCap, label: "التلاميذ" },
  { id: "news", icon: Megaphone, label: "الأخبار" },
  { id: "announcements", icon: Bell, label: "الإعلانات" },
  { id: "messages", icon: MessageSquare, label: "الرسائل" },
  { id: "schedule", icon: Calendar, label: "الجدول" },
  { id: "documentRequests", icon: FileText, label: "الوثائق" },
  { id: "posters", icon: Image, label: "الملصقات" },
  { id: "reports", icon: BarChart3, label: "التقارير" },
  { id: "settings", icon: Settings, label: "الإعدادات" },
];
