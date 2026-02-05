import { ReactNode } from "react";
import { NewsTicker } from "@/components/NewsTicker";
import { useNewsTicker } from "@/hooks/useNewsTicker";

interface DashboardLayoutProps {
  children: ReactNode;
  header: ReactNode;
  bottomNav: ReactNode;
}

export const DashboardLayout = ({ children, header, bottomNav }: DashboardLayoutProps) => {
  const { hasNews, tickerHeight } = useNewsTicker();
  const headerHeight = 56;

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-clip pt-[env(safe-area-inset-top)]">
      {/* شريط الأخبار الثابت */}
      {hasNews && (
        <div className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-50">
          <NewsTicker />
        </div>
      )}
      
      {/* الهيدر الثابت */}
      <div 
        className="fixed left-0 right-0 z-40 bg-background/98 backdrop-blur-xl border-b shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        style={{ top: `calc(env(safe-area-inset-top) + ${hasNews ? tickerHeight : 0}px)` }}
      >
        {header}
      </div>

      {/* المسافة العلوية */}
      <div style={{ height: (hasNews ? tickerHeight : 0) + headerHeight }} />

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-3 md:p-4 pb-28 md:pb-32 w-full">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* شريط التنقل السفلي */}
      {bottomNav}
    </div>
  );
};

export const useDashboardLayout = () => {
  const { hasNews, tickerHeight } = useNewsTicker();
  return { hasNews, tickerHeight, headerHeight: 56 };
};
