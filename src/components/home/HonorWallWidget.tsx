import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, Award, Medal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Achievement {
  id: string;
  title: string;
  description: string | null;
  achievement_type: string;
  student_name: string;
  grade_level: string;
}

// Fallback achievements when database is empty
const fallbackAchievements: Achievement[] = [
  {
    id: "1",
    title: "التفوق الدراسي",
    description: "الأول على القسم",
    achievement_type: "academic",
    student_name: "طالب متفوق",
    grade_level: "السنة الخامسة",
  },
  {
    id: "2",
    title: "السلوك المثالي",
    description: "نموذج في الانضباط",
    achievement_type: "behavior",
    student_name: "طالب مثالي",
    grade_level: "السنة الرابعة",
  },
];

const getAchievementIcon = (type: string) => {
  switch (type) {
    case "academic":
      return Star;
    case "sports":
      return Medal;
    case "arts":
      return Sparkles;
    case "behavior":
      return Award;
    default:
      return Trophy;
  }
};

const getAchievementGradient = (type: string) => {
  switch (type) {
    case "academic":
      return "from-yellow-400/30 to-amber-500/30";
    case "sports":
      return "from-green-400/30 to-emerald-500/30";
    case "arts":
      return "from-purple-400/30 to-violet-500/30";
    case "behavior":
      return "from-blue-400/30 to-cyan-500/30";
    default:
      return "from-orange-400/30 to-red-500/30";
  }
};

export const HonorWallWidget = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAchievements();
  }, []);

  useEffect(() => {
    if (achievements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % achievements.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [achievements.length]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("student_achievements")
        .select(`
          id,
          title,
          description,
          achievement_type,
          student:students(full_name, grade_level)
        `)
        .eq("is_featured", true)
        .order("achieved_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedData = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          achievement_type: item.achievement_type,
          student_name: item.student?.full_name || "طالب",
          grade_level: item.student?.grade_level || "",
        }));
        setAchievements(formattedData);
      } else {
        setAchievements(fallbackAchievements);
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
      setAchievements(fallbackAchievements);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl backdrop-blur-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-white/20 p-4 animate-pulse">
        <div className="h-24" />
      </div>
    );
  }

  if (achievements.length === 0) return null;

  const current = achievements[currentIndex];
  const AchievementIcon = getAchievementIcon(current.achievement_type);
  const gradient = getAchievementGradient(current.achievement_type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-lg bg-gradient-to-br ${gradient} border border-white/20 p-4`}
    >
      {/* Trophy decoration */}
      <div className="absolute top-2 left-2">
        <Trophy className="w-5 h-5 text-yellow-300 animate-pulse" />
      </div>
      <div className="absolute bottom-2 right-2">
        <Star className="w-4 h-4 text-yellow-200 animate-bounce" />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-full bg-yellow-400/30">
          <Award className="w-5 h-5 text-yellow-300" />
        </div>
        <h3 className="text-white font-bold font-cairo text-sm">
          ⭐ جدار الشرف
        </h3>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-white/10">
              <AchievementIcon className="w-4 h-4 text-yellow-300" />
            </div>
            <span className="text-white font-bold font-cairo text-sm">
              {current.title}
            </span>
          </div>
          
          <div className="pr-8">
            <p className="text-white/90 font-bold font-cairo">
              🏆 {current.student_name}
            </p>
            <p className="text-white/60 text-xs font-cairo">
              {current.grade_level}
              {current.description && ` • ${current.description}`}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination dots */}
      {achievements.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {achievements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "bg-yellow-300 w-3" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};
