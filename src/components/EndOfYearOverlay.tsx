import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { GraduationCap, Sparkles, Sun } from "lucide-react";

interface EndOfYearSetting {
  enabled: boolean;
  title?: string;
  message?: string;
  submessage?: string;
}

const DEFAULTS: EndOfYearSetting = {
  enabled: false,
  title: "انتهى العام الدراسي",
  message: "نتمنى لجميع تلاميذنا الأعزاء عطلة صيفية ممتعة ومفيدة",
  submessage: "انتظرونا مع انطلاقة عام دراسي جديد بإذن الله",
};

export const EndOfYearOverlay = () => {
  const [setting, setSetting] = useState<EndOfYearSetting>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchSetting = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "end_of_year_mode")
        .maybeSingle();

      if (data?.setting_value) {
        setSetting({ ...DEFAULTS, ...(data.setting_value as any) });
      }
      setLoaded(true);
    };

    fetchSetting();

    // إعادة الجلب كل دقيقة لالتقاط أي تغيير من المسؤول
    const interval = setInterval(fetchSetting, 60000);

    // الاستماع للتحديثات في الزمن الحقيقي
    const channel = supabase
      .channel("end_of_year_settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
          filter: "setting_key=eq.end_of_year_mode",
        },
        () => fetchSetting()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // السماح للمسؤول بالوصول للوحته لإيقاف الوضع
  const isAdminRoute =
    location.pathname.startsWith("/dashboard/admin") ||
    location.pathname.startsWith("/login/admin");

  if (!loaded || !setting.enabled || isAdminRoute) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        dir="rtl"
        className="fixed inset-0 z-[9999] overflow-hidden font-cairo"
        style={{
          background:
            "linear-gradient(135deg, hsl(220 70% 15%) 0%, hsl(260 60% 25%) 50%, hsl(200 80% 30%) 100%)",
        }}
      >
        {/* خلفية متحركة - نجوم وفقاعات */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/20 blur-sm"
              style={{
                width: Math.random() * 80 + 20,
                height: Math.random() * 80 + 20,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* الشمس / التوهج */}
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsl(45 100% 65% / 0.4) 0%, transparent 70%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />

        {/* المحتوى الرئيسي */}
        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 12,
              delay: 0.2,
            }}
            className="relative mb-8"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/50">
              <GraduationCap className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-lg" />
            </div>
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -left-2"
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              <Sun className="w-7 h-7 text-amber-300 drop-shadow-lg" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #fef9c3 0%, #fde68a 50%, #fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {setting.title}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="h-1 w-32 bg-gradient-to-r from-transparent via-amber-300 to-transparent mb-6"
          />

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="text-lg md:text-2xl text-white/90 mb-6 max-w-2xl leading-relaxed font-medium"
          >
            {setting.message}
          </motion.p>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="relative"
          >
            <div className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
              <p className="text-base md:text-xl text-white font-semibold flex items-center gap-2 justify-center flex-wrap">
                <Sparkles className="w-5 h-5 text-amber-300" />
                {setting.submessage}
                <Sparkles className="w-5 h-5 text-amber-300" />
              </p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-8 text-white/60 text-sm font-medium"
          >
            همزة وصل — المدرسة الابتدائية
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
