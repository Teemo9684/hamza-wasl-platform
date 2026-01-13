import React from 'react';
import { motion } from 'framer-motion';

interface NationalBackgroundProps {
  occasionType: string;
  occasionName: string;
}

const NationalBackground: React.FC<NationalBackgroundProps> = ({ occasionType, occasionName }) => {
  // Algerian flag colors
  const green = '#006233';
  const white = '#FFFFFF';
  const red = '#D21034';

  // Generate floating particles in flag colors
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color: [green, red][i % 2],
    size: 10 + Math.random() * 20,
    delay: Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Algerian Flag Background */}
      <div className="absolute inset-0 flex">
        <motion.div 
          className="w-1/2 h-full"
          style={{ backgroundColor: green }}
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="w-1/2 h-full"
          style={{ backgroundColor: white }}
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Overlay gradient for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

      {/* Central emblem - Crescent and Star */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <svg viewBox="0 0 200 200" className="w-64 h-64 md:w-96 md:h-96">
          {/* Crescent */}
          <circle cx="100" cy="100" r="60" fill={red} />
          <circle cx="115" cy="100" r="48" fill={green} />
          
          {/* Star */}
          <polygon
            points="100,50 106,75 132,75 111,90 119,115 100,100 81,115 89,90 68,75 94,75"
            fill={red}
            transform="translate(25, 15) scale(0.7)"
          />
        </svg>
      </motion.div>

      {/* Floating flag-colored particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-30"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Top decorative flags */}
      <div className="absolute top-0 left-0 right-0 h-24 flex justify-around items-start pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="relative"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            {/* Flag pole */}
            <div className="w-1 h-20 bg-gray-600" />
            
            {/* Flag */}
            <motion.div
              className="absolute top-2 left-1 w-10 h-6 flex overflow-hidden rounded-sm shadow-lg"
              animate={{ rotateY: [0, 5, 0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            >
              <div className="w-1/2 h-full" style={{ backgroundColor: green }} />
              <div className="w-1/2 h-full bg-white" />
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ backgroundColor: red }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Historical text or slogan */}
      <motion.div
        className="absolute top-16 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
          <span className="text-2xl md:text-3xl font-bold text-white">
            {occasionType === 'independence_day' && '🇩🇿 مجد الشهداء 🇩🇿'}
            {occasionType === 'revolution_day' && '🇩🇿 ثورة نوفمبر المجيدة 🇩🇿'}
            {occasionType === 'martyrs_day' && '🇩🇿 يوم الشهيد 🇩🇿'}
            {occasionType === 'youth_day' && '🇩🇿 يوم الشباب 🇩🇿'}
          </span>
        </div>
      </motion.div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 100" className="w-full h-16" preserveAspectRatio="none">
          <motion.path
            d="M0,50 Q300,100 600,50 T1200,50 L1200,100 L0,100 Z"
            fill={green}
            opacity={0.3}
            animate={{ d: [
              "M0,50 Q300,100 600,50 T1200,50 L1200,100 L0,100 Z",
              "M0,60 Q300,20 600,60 T1200,60 L1200,100 L0,100 Z",
              "M0,50 Q300,100 600,50 T1200,50 L1200,100 L0,100 Z",
            ]}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>

      {/* Occasion Badge */}
      <motion.div
        className="absolute top-4 right-4 bg-gradient-to-r from-green-500/30 to-red-500/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-white text-sm font-semibold">🇩🇿 {occasionName}</span>
      </motion.div>
    </div>
  );
};

export default NationalBackground;
