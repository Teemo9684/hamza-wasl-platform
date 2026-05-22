import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { realtimeManager } from "@/utils/realtimeManager";

interface CountdownData {
  id: string;
  title: string;
  subtitle: string | null;
  target_date: string;
  image_url: string | null;
  result_message: string | null;
  is_enabled: boolean;
}

const calc = (target: Date) => {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    finished: false,
  };
};

const TimeBox = ({ value, label }: { value: number; label: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 200, damping: 18 }}
    className="relative flex flex-col items-center"
  >
    <div className="relative bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl px-3 py-3 sm:px-5 sm:py-4 min-w-[64px] sm:min-w-[80px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="block text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center font-mono tabular-nums drop-shadow-lg"
        >
          {value.toString().padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
    </div>
    <span className="mt-2 text-xs sm:text-sm text-white/90 font-cairo font-medium">{label}</span>
  </motion.div>
);

export const ResultsCountdown = () => {
  const [data, setData] = useState<CountdownData | null>(null);
  const [time, setTime] = useState(() => calc(new Date()));

  useEffect(() => {
    const fetchData = async () => {
      const { data: rows } = await supabase
        .from("results_countdown")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      if (rows && rows.length > 0) setData(rows[0] as CountdownData);
    };
    fetchData();

    const cleanup = realtimeManager.subscribe(
      "results-countdown-public",
      "results_countdown",
      () => fetchData()
    );
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (!data) return;
    const target = new Date(data.target_date);
    const update = () => setTime(calc(target));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [data]);

  if (!data || !data.is_enabled) return null;

  const finished = time.finished;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto mb-8"
    >
      <div className="relative rounded-3xl overflow-hidden border border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-purple-600/30 to-emerald-500/30 animate-[gradient_8s_ease_infinite] bg-[length:200%_200%]" />
        <div className="absolute inset-0 backdrop-blur-2xl bg-white/5" />

        {/* Floating decorations */}
        <motion.div
          className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/30 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400/30 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative p-5 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-3 shadow-lg"
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {finished ? (
                <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              ) : (
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              )}
            </motion.div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-cairo drop-shadow-md">
              {data.title}
            </h2>
            {data.subtitle && !finished && (
              <p className="text-sm sm:text-base text-white/85 font-cairo mt-1">
                {data.subtitle}
              </p>
            )}
          </div>

          {/* Body */}
          {!finished ? (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4" dir="ltr">
              <TimeBox value={time.days} label="يوم" />
              <span className="text-white/70 text-2xl sm:text-3xl font-bold mt-[-20px]">:</span>
              <TimeBox value={time.hours} label="ساعة" />
              <span className="text-white/70 text-2xl sm:text-3xl font-bold mt-[-20px]">:</span>
              <TimeBox value={time.minutes} label="دقيقة" />
              <span className="text-white/70 text-2xl sm:text-3xl font-bold mt-[-20px]">:</span>
              <TimeBox value={time.seconds} label="ثانية" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-4"
            >
              {data.result_message && (
                <div className="flex items-center gap-2 text-white font-cairo text-lg sm:text-2xl font-bold text-center">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
                  <span className="drop-shadow-md">{data.result_message}</span>
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 animate-pulse" />
                </div>
              )}
              {data.image_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="w-full rounded-2xl overflow-hidden border-4 border-white/40 shadow-2xl"
                >
                  <img
                    src={data.image_url}
                    alt={data.title}
                    className="w-full h-auto object-contain bg-white/5"
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
