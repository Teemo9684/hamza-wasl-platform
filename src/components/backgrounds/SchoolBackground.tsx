import React from 'react';
import { motion } from 'framer-motion';

interface SchoolBackgroundProps {
  occasionType: string;
  occasionName: string;
}

const SchoolBackground: React.FC<SchoolBackgroundProps> = ({ occasionType, occasionName }) => {
  const isSchoolStart = occasionType === 'school_start';
  const isSchoolEnd = occasionType === 'school_end';
  const isKnowledgeDay = occasionType === 'knowledge_day';
  const isTeacherDay = occasionType === 'teacher_day';

  // School-related floating items
  const items = [
    { emoji: '📚', left: '10%', delay: 0 },
    { emoji: '✏️', left: '25%', delay: 0.5 },
    { emoji: '🎒', left: '40%', delay: 1 },
    { emoji: '📐', left: '55%', delay: 1.5 },
    { emoji: '🖊️', left: '70%', delay: 2 },
    { emoji: '📖', left: '85%', delay: 2.5 },
  ];

  // Teacher day specific items
  const teacherItems = [
    { emoji: '👩‍🏫', left: '15%', delay: 0 },
    { emoji: '🍎', left: '35%', delay: 0.7 },
    { emoji: '📝', left: '55%', delay: 1.4 },
    { emoji: '🌟', left: '75%', delay: 2.1 },
  ];

  const displayItems = isTeacherDay ? teacherItems : items;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Background */}
      <div className={`absolute inset-0 ${
        isSchoolStart 
          ? 'bg-gradient-to-b from-blue-900 via-indigo-800 to-purple-900'
          : isSchoolEnd
          ? 'bg-gradient-to-b from-orange-800 via-amber-700 to-yellow-800'
          : isKnowledgeDay
          ? 'bg-gradient-to-b from-emerald-900 via-teal-800 to-cyan-900'
          : 'bg-gradient-to-b from-rose-900 via-pink-800 to-purple-900'
      }`} />

      {/* Chalkboard pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Floating school items */}
      {displayItems.map((item, i) => (
        <motion.div
          key={i}
          className="absolute top-0 text-4xl md:text-5xl"
          style={{ left: item.left }}
          animate={{
            y: ['-10%', '110vh'],
            rotate: [0, 360],
          }}
          transition={{
            duration: 15 + Math.random() * 5,
            delay: item.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {item.emoji}
        </motion.div>
      ))}

      {/* Central message */}
      <motion.div
        className="absolute top-12 left-1/2 -translate-x-1/2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20 shadow-xl">
          <span className="text-2xl md:text-3xl font-bold text-white">
            {isSchoolStart && '📚 بداية موفقة 📚'}
            {isSchoolEnd && '🎉 مبروك النجاح 🎉'}
            {isKnowledgeDay && '📖 يوم العلم 📖'}
            {isTeacherDay && '🌹 شكراً معلمي 🌹'}
          </span>
        </div>
      </motion.div>

      {/* Decorative elements based on occasion */}
      {isSchoolStart && (
        <motion.div
          className="absolute bottom-20 left-1/2 -translate-x-1/2"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-8xl">🏫</div>
        </motion.div>
      )}

      {isSchoolEnd && (
        <>
          {/* Graduation caps */}
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{ left: `${15 + i * 18}%`, bottom: '30%' }}
              animate={{
                y: [0, -100, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              🎓
            </motion.div>
          ))}
        </>
      )}

      {isTeacherDay && (
        <motion.div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-6xl">🌷</span>
          <span className="text-6xl">❤️</span>
          <span className="text-6xl">🌷</span>
        </motion.div>
      )}

      {/* Animated pencils border */}
      <div className="absolute top-0 left-0 right-0 flex justify-around">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="text-2xl"
            animate={{ rotate: [0, 10, 0, -10, 0] }}
            transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
          >
            ✏️
          </motion.div>
        ))}
      </div>

      {/* Occasion Badge */}
      <motion.div
        className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-white text-sm font-semibold">📚 {occasionName}</span>
      </motion.div>
    </div>
  );
};

export default SchoolBackground;
