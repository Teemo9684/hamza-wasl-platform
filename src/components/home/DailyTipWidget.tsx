import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Tip {
  id: string;
  content: string;
}

// Fallback tips when no tips are in database
const fallbackTips = [
  "شجع طفلك على القراءة يومياً لمدة 15 دقيقة على الأقل 📚",
  "امدح جهود طفلك وليس فقط نتائجه، هذا يبني الثقة بالنفس 💪",
  "خصص وقتاً يومياً للحوار مع طفلك عن يومه المدرسي 💬",
  "النوم الكافي أساس التركيز والتحصيل الجيد - 8 ساعات للأطفال 😴",
  "علم طفلك تنظيم وقته بين الدراسة واللعب ⏰",
  "شارك طفلك في حل الواجبات دون أن تحلها عنه 🤝",
  "الإفطار الصحي يزيد من تركيز طفلك في المدرسة 🍎",
  "شجع طفلك على طرح الأسئلة - الفضول أساس التعلم ❓",
  "علم طفلك أن الخطأ جزء من التعلم وليس فشلاً ✨",
  "احتفل بالإنجازات الصغيرة لتحفيز طفلك 🎉",
];

export const DailyTipWidget = () => {
  const [tip, setTip] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTip();
  }, []);

  const fetchTip = async () => {
    try {
      // Try to get tip from database
      const { data, error } = await supabase
        .from("educational_tips")
        .select("content")
        .eq("is_active", true)
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        // Get random tip from database
        const randomTip = data[Math.floor(Math.random() * data.length)];
        setTip(randomTip.content);
      } else {
        // Use fallback tips
        const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
        setTip(randomTip);
      }
    } catch (error) {
      console.error("Error fetching tip:", error);
      // Use fallback on error
      const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
      setTip(randomTip);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTip();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="rounded-2xl backdrop-blur-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/20 p-4 animate-pulse">
        <div className="h-20" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl backdrop-blur-lg bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-orange-500/20 border border-white/20 p-4"
    >
      {/* Sparkle decorations */}
      <div className="absolute top-2 left-2">
        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-yellow-400/30">
            <Lightbulb className="w-5 h-5 text-yellow-300" />
          </div>
          <h3 className="text-white font-bold font-cairo text-sm">
            💡 نصيحة اليوم التربوية
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw 
            className={`w-4 h-4 text-white/70 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={tip}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-white/90 text-sm font-cairo leading-relaxed"
        >
          {tip}
        </motion.p>
      </AnimatePresence>

      {/* Decorative gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400/50 via-amber-400/50 to-orange-400/50" />
    </motion.div>
  );
};
