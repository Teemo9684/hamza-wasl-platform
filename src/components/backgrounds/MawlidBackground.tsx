import React from 'react';
import { motion } from 'framer-motion';

interface MawlidBackgroundProps {
  occasionType: string;
  occasionName: string;
}

const MawlidBackground: React.FC<MawlidBackgroundProps> = ({ occasionType, occasionName }) => {
  const isNewYear = occasionType === 'islamic_new_year';

  // Generate glowing particles
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 3,
  }));

  // Generate decorative crescents
  const crescents = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: `${15 + i * 14}%`,
    delay: i * 0.3,
    scale: 0.5 + Math.random() * 0.3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Rich Islamic Green Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a3622] via-[#064e3b] to-[#022c22]" />
      
      {/* Animated light rays */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.15) 0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.25) 0%, transparent 60%)',
            'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.15) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Islamic geometric pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z'/%3E%3Cpath d='M40 20L60 40L40 60L20 40Z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Glowing particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            backgroundColor: '#fbbf24',
            boxShadow: '0 0 10px rgba(251,191,36,0.6)',
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Top decorative crescents */}
      {crescents.map((crescent) => (
        <motion.div
          key={crescent.id}
          className="absolute top-4"
          style={{ left: crescent.left, transform: `scale(${crescent.scale})` }}
          animate={{ y: [0, 5, 0] }}
          transition={{
            duration: 3,
            delay: crescent.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
            <div className="absolute top-0.5 left-1.5 w-[60%] h-[60%] rounded-full bg-[#064e3b]" />
          </div>
        </motion.div>
      ))}

      {/* Central Mawlid/New Year Message */}
      <motion.div
        className="absolute top-16 left-1/2 -translate-x-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        <div className="relative">
          {/* Decorative frame */}
          <motion.div
            className="absolute -inset-3 border-2 border-yellow-500/30 rounded-xl"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(234,179,8,0.2)',
                '0 0 40px rgba(234,179,8,0.4)',
                '0 0 20px rgba(234,179,8,0.2)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="bg-gradient-to-r from-emerald-900/80 to-green-900/80 backdrop-blur-sm rounded-xl px-6 py-4 border border-yellow-500/30">
            <div className="text-center">
              <span className="text-2xl md:text-3xl font-bold text-yellow-300 block">
                {isNewYear ? '🌙 عام هجري مبارك 🌙' : '🌙 صلى الله عليه وسلم 🌙'}
              </span>
              <span className="text-lg text-emerald-200 mt-2 block">
                {occasionName}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calligraphy-style decorative text */}
      <motion.div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center opacity-30"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <span className="text-4xl md:text-6xl text-yellow-400 font-arabic" style={{ fontFamily: 'serif' }}>
          ﷺ
        </span>
      </motion.div>

      {/* Bottom decorative lanterns */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="text-3xl"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          >
            🏮
          </motion.div>
        ))}
      </div>

      {/* Occasion Badge */}
      <motion.div
        className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500/20 to-yellow-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-400/30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-yellow-200 text-sm font-semibold">🌙 {occasionName}</span>
      </motion.div>
    </div>
  );
};

export default MawlidBackground;
