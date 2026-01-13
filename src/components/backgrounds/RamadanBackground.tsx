import React from 'react';
import { motion } from 'framer-motion';

interface RamadanBackgroundProps {
  occasionType: string;
  occasionName: string;
}

const RamadanBackground: React.FC<RamadanBackgroundProps> = ({ occasionName }) => {
  // Generate lanterns
  const lanterns = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${10 + i * 12}%`,
    delay: i * 0.3,
    scale: 0.6 + Math.random() * 0.4,
  }));

  // Generate stars
  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 50}%`,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#1a237e] to-[#311b92]" />
      
      {/* Animated gradient overlay */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 20%, rgba(255,215,0,0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 80% 30%, rgba(255,215,0,0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 20% 20%, rgba(255,215,0,0.2) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Crescent Moon */}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2 w-20 h-20 md:w-28 md:h-28"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative w-full h-full">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-[0_0_40px_rgba(255,215,0,0.6)]" />
          <div className="absolute top-1 left-3 w-[70%] h-[70%] rounded-full bg-[#1a237e]" />
        </div>
      </motion.div>

      {/* Lanterns */}
      {lanterns.map((lantern) => (
        <motion.div
          key={lantern.id}
          className="absolute top-0"
          style={{ left: lantern.left }}
          initial={{ y: -100 }}
          animate={{ y: [0, 15, 0] }}
          transition={{
            duration: 3 + Math.random(),
            delay: lantern.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div 
            className="relative"
            style={{ transform: `scale(${lantern.scale})` }}
          >
            {/* Lantern rope */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-yellow-600" />
            
            {/* Lantern body */}
            <div className="relative mt-8">
              {/* Top cap */}
              <div className="w-10 h-3 mx-auto bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-t-lg" />
              
              {/* Main body */}
              <div className="relative w-12 h-16 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500 via-orange-500 to-red-600 rounded-lg opacity-90" />
                <div className="absolute inset-1 bg-gradient-to-b from-yellow-300/50 to-orange-400/50 rounded-lg" />
                
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(255,165,0,0.6)',
                      '0 0 40px rgba(255,165,0,0.8)',
                      '0 0 20px rgba(255,165,0,0.6)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                
                {/* Decorative patterns */}
                <div className="absolute inset-x-2 top-2 bottom-2 border-2 border-yellow-300/30 rounded" />
              </div>
              
              {/* Bottom cap */}
              <div className="w-8 h-2 mx-auto bg-gradient-to-b from-yellow-700 to-yellow-800 rounded-b-lg" />
            </div>
          </div>
        </motion.div>
      ))}

      {/* Occasion Badge */}
      <motion.div
        className="absolute top-4 right-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-amber-400/30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-amber-200 text-sm font-semibold">🌙 {occasionName}</span>
      </motion.div>

      {/* Bottom decorative mosque silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent">
        <svg viewBox="0 0 1200 100" className="absolute bottom-0 w-full h-20 fill-black/30">
          <path d="M0,100 L0,60 Q50,40 100,60 L100,50 Q150,20 200,50 L200,60 Q250,40 300,60 L300,100 Z M300,100 L300,40 Q350,0 400,40 L400,100 Z M400,100 L400,60 Q450,40 500,60 L500,100 Z M500,100 L500,30 Q550,-10 600,30 L600,100 Z M600,100 L600,60 Q650,40 700,60 L700,100 Z M700,100 L700,40 Q750,0 800,40 L800,100 Z M800,100 L800,60 Q850,40 900,60 L900,50 Q950,20 1000,50 L1000,60 Q1050,40 1100,60 L1100,100 Z M1100,100 L1100,40 Q1150,0 1200,40 L1200,100 Z" />
        </svg>
      </div>
    </div>
  );
};

export default RamadanBackground;
