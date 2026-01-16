import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Cake, Gift, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isThisWeek, parseISO, differenceInDays, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";

interface Birthday {
  id: string;
  full_name: string;
  date_of_birth: string;
  grade_level: string;
  daysUntil: number;
}

export const BirthdaysWidget = () => {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  useEffect(() => {
    if (birthdays.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % birthdays.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [birthdays.length]);

  const fetchBirthdays = async () => {
    try {
      const today = new Date();
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, date_of_birth, grade_level")
        .not("date_of_birth", "is", null);

      if (error) throw error;

      if (data) {
        const upcomingBirthdays = data
          .map((student) => {
            if (!student.date_of_birth) return null;
            
            const dob = parseISO(student.date_of_birth);
            const thisYearBirthday = new Date(
              today.getFullYear(),
              dob.getMonth(),
              dob.getDate()
            );
            
            // If birthday passed this year, check next year
            if (thisYearBirthday < today && !isSameDay(thisYearBirthday, today)) {
              thisYearBirthday.setFullYear(today.getFullYear() + 1);
            }
            
            const daysUntil = differenceInDays(thisYearBirthday, today);
            
            // Show birthdays within the next 7 days
            if (daysUntil >= 0 && daysUntil <= 7) {
              return {
                ...student,
                daysUntil,
              };
            }
            return null;
          })
          .filter(Boolean) as Birthday[];

        // Sort by days until birthday
        upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
        setBirthdays(upcomingBirthdays);
      }
    } catch (error) {
      console.error("Error fetching birthdays:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || birthdays.length === 0) return null;

  const currentBirthday = birthdays[currentIndex];
  const isToday = currentBirthday.daysUntil === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl backdrop-blur-lg bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-amber-500/20 border border-white/20 p-4"
    >
      {/* Floating decorations */}
      <div className="absolute top-2 right-2 animate-bounce">
        <PartyPopper className="w-5 h-5 text-yellow-300" />
      </div>
      <div className="absolute bottom-2 left-2 animate-pulse">
        <Gift className="w-4 h-4 text-pink-300" />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-full ${isToday ? 'bg-yellow-400/30 animate-pulse' : 'bg-pink-400/30'}`}>
          <Cake className={`w-5 h-5 ${isToday ? 'text-yellow-300' : 'text-pink-300'}`} />
        </div>
        <h3 className="text-white font-bold font-cairo text-sm">
          {isToday ? "🎉 عيد ميلاد اليوم!" : "🎂 أعياد ميلاد هذا الأسبوع"}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentBirthday.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-1"
        >
          <p className="text-white font-bold text-lg font-cairo flex items-center gap-2">
            {currentBirthday.full_name}
            {isToday && <span className="text-2xl animate-bounce">🎈</span>}
          </p>
          <p className="text-white/70 text-sm font-cairo">
            {currentBirthday.grade_level}
          </p>
          <p className="text-white/60 text-xs font-cairo">
            {isToday 
              ? "عيد ميلاد سعيد! 🎊" 
              : `بعد ${currentBirthday.daysUntil} ${currentBirthday.daysUntil === 1 ? 'يوم' : 'أيام'}`
            }
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Pagination dots */}
      {birthdays.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {birthdays.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "bg-white w-3" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Confetti effect for today's birthday */}
      {isToday && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB', '#32CD32'][i],
                left: `${Math.random() * 100}%`,
              }}
              initial={{ y: -10, opacity: 1 }}
              animate={{ 
                y: 150, 
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
