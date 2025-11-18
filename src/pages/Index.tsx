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
      {/* Animated Background Elements with Geometric Flowers */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Soft gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        
        {/* Geometric Flower Shapes */}
        <svg className="absolute top-10 right-20 w-32 h-32 text-white/10 blur-sm animate-pulse" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="15" fill="currentColor" />
          <circle cx="50" cy="25" r="10" fill="currentColor" />
          <circle cx="75" cy="50" r="10" fill="currentColor" />
          <circle cx="50" cy="75" r="10" fill="currentColor" />
          <circle cx="25" cy="50" r="10" fill="currentColor" />
          <circle cx="65" cy="35" r="8" fill="currentColor" />
          <circle cx="65" cy="65" r="8" fill="currentColor" />
          <circle cx="35" cy="65" r="8" fill="currentColor" />
          <circle cx="35" cy="35" r="8" fill="currentColor" />
        </svg>
        
        <svg className="absolute bottom-32 left-16 w-40 h-40 text-accent/15 blur-sm animate-pulse" style={{ animationDelay: "1s" }} viewBox="0 0 100 100">
          <polygon points="50,20 80,50 50,80 20,50" fill="currentColor" />
          <circle cx="50" cy="50" r="12" fill="currentColor" />
          <circle cx="50" cy="20" r="8" fill="currentColor" />
          <circle cx="80" cy="50" r="8" fill="currentColor" />
          <circle cx="50" cy="80" r="8" fill="currentColor" />
          <circle cx="20" cy="50" r="8" fill="currentColor" />
        </svg>
        
        <svg className="absolute top-1/3 left-1/4 w-28 h-28 text-white/8 blur-md animate-pulse" style={{ animationDelay: "2s" }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="12" fill="currentColor" />
          <circle cx="30" cy="30" r="10" fill="currentColor" />
          <circle cx="70" cy="30" r="10" fill="currentColor" />
          <circle cx="70" cy="70" r="10" fill="currentColor" />
          <circle cx="30" cy="70" r="10" fill="currentColor" />
          <circle cx="50" cy="25" r="7" fill="currentColor" />
          <circle cx="75" cy="50" r="7" fill="currentColor" />
          <circle cx="50" cy="75" r="7" fill="currentColor" />
          <circle cx="25" cy="50" r="7" fill="currentColor" />
        </svg>
        
        <svg className="absolute top-2/3 right-1/4 w-36 h-36 text-accent/12 blur-sm animate-pulse" style={{ animationDelay: "1.5s" }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="18" fill="currentColor" />
          <circle cx="50" cy="20" r="12" fill="currentColor" />
          <circle cx="80" cy="50" r="12" fill="currentColor" />
          <circle cx="50" cy="80" r="12" fill="currentColor" />
          <circle cx="20" cy="50" r="12" fill="currentColor" />
        </svg>
        
        <svg className="absolute bottom-1/4 right-1/3 w-24 h-24 text-white/12 blur-md animate-pulse" style={{ animationDelay: "0.5s" }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="10" fill="currentColor" />
          <circle cx="35" cy="35" r="8" fill="currentColor" />
          <circle cx="65" cy="35" r="8" fill="currentColor" />
          <circle cx="65" cy="65" r="8" fill="currentColor" />
          <circle cx="35" cy="65" r="8" fill="currentColor" />
        </svg>
      </div>

      {/* News Ticker */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/10 backdrop-blur-md border-b border-white/20 overflow-hidden">
        <div className="ticker-animation py-3 inline-flex min-w-max items-center gap-8 whitespace-nowrap">
          {/* Repeat items 3 times for seamless scrolling */}
          {[...Array(3)].map((_, repeatIndex) => (
            newsItems.map((item, itemIndex) => (
              <div key={`${repeatIndex}-${item.id}`} className="flex items-center gap-8">
                <span className="text-white font-cairo flex items-center gap-2">
                  <span className={`${item.badge_color} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                    {item.icon_type}
                  </span>
                  {item.content}
                </span>
                
                {/* Logo separator */}
                <div className="relative h-8 w-12 flex-shrink-0">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-white/80 font-ruqaa leading-[0.8]">
                      {itemIndex % 2 === 0 ? (
                        <>
                          <div>همزة</div>
                          <div>وصل</div>
                        </>
                      ) : (
                        <>
                          <div>العربي</div>
                          <div>التبسي</div>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8 pt-24">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative h-32 mb-6">
            {/* همزة وصل */}
            <div className="absolute inset-0 flex flex-col items-center justify-center magic-rotate-1">
              <h1 className="text-4xl font-bold text-white font-ruqaa leading-[0.9]">
                <div>همزة</div>
                <div>وصل</div>
              </h1>
            </div>
            
            {/* العربي التبسي */}
            <div className="absolute inset-0 flex flex-col items-center justify-center magic-rotate-2">
              <h1 className="text-4xl font-bold text-white font-ruqaa leading-[0.9]">
                <div>العربي</div>
                <div>التبسي</div>
              </h1>
            </div>
          </div>
          
          <div>
            <p className="text-2xl text-white/90 font-cairo mb-2">
              منصة التواصل التربوي
            </p>
            <p className="text-sm text-white/70 font-cairo">
              المدرسة الابتدائية العربي التبسي
            </p>
          </div>
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
              <div className="relative icon-float">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 icon-pulse" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Users className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cairo">أولياء الأمور</h2>
                <p className="text-white/80 font-cairo">تابع مستوى أبنائك الدراسي</p>
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
              <div className="relative icon-float" style={{ animationDelay: "0.5s" }}>
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 icon-pulse" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <GraduationCap className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cairo">المعلمين</h2>
                <p className="text-white/80 font-cairo">إدارة الأقسام والتلاميذ</p>
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
              <div className="relative icon-float" style={{ animationDelay: "1s" }}>
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 icon-pulse" />
                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-8 group-hover:bg-white/30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Shield className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>
              </div>
              
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cairo">الإدارة</h2>
                <p className="text-white/80 font-cairo">لوحة التحكم الإدارية</p>
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
          <p className="text-white/70 font-cairo text-lg">
            اختر نوع الحساب للدخول إلى المنصة
          </p>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <p className="text-white/60 font-cairo text-sm">
            © 2026 مدرسة العربي التبسي - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
