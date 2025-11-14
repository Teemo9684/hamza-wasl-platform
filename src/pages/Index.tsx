import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  icon_type: string;
  badge_color: string;
  is_active: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetchNewsItems();
  }, []);

  const fetchNewsItems = async () => {
    const { data } = await supabase
      .from("news_ticker")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setNewsItems(data);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-accent">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* News Ticker */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/10 backdrop-blur-md border-b border-white/20 overflow-hidden">
        <div className="ticker-animation py-3 flex items-center gap-8 whitespace-nowrap">
          {newsItems.map((item) => (
            <span key={item.id} className="text-white font-tajawal flex items-center gap-2">
              <span className={`${item.badge_color} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                {item.icon_type}
              </span>
              {item.content}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {newsItems.map((item) => (
            <span key={`duplicate-${item.id}`} className="text-white font-tajawal flex items-center gap-2">
              <span className={`${item.badge_color} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                {item.icon_type}
              </span>
              {item.content}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8 pt-24">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative h-24 mb-6">
            {/* همزة وصل */}
            <div className="absolute inset-0 flex flex-col items-center justify-center magic-fade-1">
              <h1 className="text-3xl font-bold text-white font-ruqaa leading-tight">
                <div>همزة</div>
                <div>وصل</div>
              </h1>
            </div>
            
            {/* العربي التبسي */}
            <div className="absolute inset-0 flex flex-col items-center justify-center magic-fade-2">
              <h1 className="text-3xl font-bold text-white font-ruqaa leading-tight">
                <div>العربي</div>
                <div>التبسي</div>
              </h1>
            </div>
          </div>
          
          <p className="text-2xl text-white/90 font-tajawal">
            منصة التواصل التربوي الحديثة لربط المدرسة بالبيت
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Parent Card */}
          <div 
            onClick={() => navigate("/login/parent")}
            className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:bg-white/20 border border-white/20 hover:border-white/40 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon Container */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Users className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cairo">أولياء الأمور</h2>
                <p className="text-white/80 font-tajawal">تابع مستوى أبنائك الدراسي</p>
              </div>

              {/* Arrow Icon */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:-translate-x-2">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Teacher Card */}
          <div 
            onClick={() => navigate("/login/teacher")}
            className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:bg-white/20 border border-white/20 hover:border-white/40 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon Container */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <GraduationCap className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cairo">المعلمين</h2>
                <p className="text-white/80 font-tajawal">إدارة الفصول والطلاب</p>
              </div>

              {/* Arrow Icon */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:-translate-x-2">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Admin Card */}
          <div 
            onClick={() => navigate("/login/admin")}
            className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:bg-white/20 border border-white/20 hover:border-white/40 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon Container */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Shield className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cairo">الإدارة</h2>
                <p className="text-white/80 font-tajawal">لوحة التحكم الإدارية</p>
              </div>

              {/* Arrow Icon */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:-translate-x-2">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <p className="text-white/70 font-tajawal text-lg">
            اختر نوع الحساب للدخول إلى المنصة
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
