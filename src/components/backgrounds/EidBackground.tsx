import React from 'react';
import { motion } from 'framer-motion';

interface EidBackgroundProps {
  occasionType: string;
  occasionName: string;
}

const EidBackground: React.FC<EidBackgroundProps> = ({ occasionType, occasionName }) => {
  const isEidAdha = occasionType === 'eid_adha';
  
  // Generate confetti
  const confetti = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
    size: 8 + Math.random() * 8,
  }));

  // Generate balloons
  const balloons = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: `${15 + i * 15}%`,
    delay: i * 0.5,
    color: ['#FF6B6B', '#4ECDC4', '#FFD700', '#9B59B6', '#3498DB', '#2ECC71'][i],
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Background */}
      <div className={`absolute inset-0 ${
        isEidAdha 
          ? 'bg-gradient-to-b from-emerald-900 via-teal-800 to-cyan-900'
          : 'bg-gradient-to-b from-purple-900 via-pink-800 to-rose-900'
      }`} />
      
      {/* Festive pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Confetti */}
      {confetti.map((c) => (
        <motion.div
          key={c.id}
          className="absolute rounded-sm"
          style={{
            left: c.left,
            top: -20,
            width: c.size,
            height: c.size * 0.6,
            backgroundColor: c.color,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, Math.random() * 100 - 50],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Balloons */}
      {balloons.map((balloon) => (
        <motion.div
          key={balloon.id}
          className="absolute bottom-0"
          style={{ left: balloon.left }}
          initial={{ y: 100 }}
          animate={{ y: [100, -800] }}
          transition={{
            duration: 15,
            delay: balloon.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="relative">
            {/* Balloon string */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-24 bg-gray-400" 
              style={{ 
                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.5))' 
              }} 
            />
            
            {/* Balloon body */}
            <motion.div
              className="w-12 h-16 rounded-full relative"
              style={{ backgroundColor: balloon.color }}
              animate={{ x: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Shine */}
              <div className="absolute top-2 left-2 w-3 h-4 bg-white/40 rounded-full blur-sm" />
              {/* Knot */}
              <div 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3"
                style={{ 
                  backgroundColor: balloon.color,
                  clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      ))}

      {/* Central Eid Greeting */}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <div className="relative">
          {/* Decorative frame */}
          <motion.div
            className="absolute inset-0 -m-4 border-4 border-yellow-400/50 rounded-xl"
            animate={{ rotate: [0, 1, -1, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-yellow-400/30">
            <span className="text-2xl md:text-3xl font-bold text-yellow-200">
              ✨ {occasionName} ✨
            </span>
          </div>
        </div>
      </motion.div>

      {/* Fireworks effect */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${20 + i * 30}%`,
            top: '20%',
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.7,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          {Array.from({ length: 8 }).map((_, j) => (
            <motion.div
              key={j}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              animate={{
                x: [0, Math.cos(j * 45 * Math.PI / 180) * 50],
                y: [0, Math.sin(j * 45 * Math.PI / 180) * 50],
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.7,
                repeat: Infinity,
                repeatDelay: 4.5,
              }}
            />
          ))}
        </motion.div>
      ))}

      {/* Occasion Badge */}
      <motion.div
        className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-400/30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-yellow-200 text-sm font-semibold">🎉 {occasionName}</span>
      </motion.div>
    </div>
  );
};

export default EidBackground;
