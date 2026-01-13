import React from 'react';
import { motion } from 'framer-motion';

interface AmazighBackgroundProps {
  occasionType: string;
  occasionName: string;
}

const AmazighBackground: React.FC<AmazighBackgroundProps> = ({ occasionName }) => {
  // Amazigh colors: Blue, Green, Yellow with the Yaz symbol
  const blue = '#0066B3';
  const green = '#228B22';
  const yellow = '#FCD116';

  // Generate Amazigh pattern elements
  const patterns = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 30 + Math.random() * 40,
    delay: Math.random() * 3,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Amazigh Flag Gradient */}
      <div className="absolute inset-0 flex flex-col">
        <motion.div 
          className="flex-1"
          style={{ backgroundColor: blue }}
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="flex-1"
          style={{ backgroundColor: green }}
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div 
          className="flex-1"
          style={{ backgroundColor: yellow }}
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.6 }}
        />
      </div>

      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/40" />

      {/* Central Yaz (ⵣ) Symbol */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none"
        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0, -2, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <svg viewBox="0 0 100 100" className="w-64 h-64 md:w-96 md:h-96" fill="red">
          {/* Yaz symbol - the Amazigh letter representing "free man" */}
          <path d="M50,10 L50,90 M30,30 L70,70 M70,30 L30,70" 
            stroke="#D62915" 
            strokeWidth="8" 
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </motion.div>

      {/* Floating Amazigh geometric patterns */}
      {patterns.map((pattern) => (
        <motion.div
          key={pattern.id}
          className="absolute pointer-events-none opacity-20"
          style={{
            left: pattern.left,
            top: pattern.top,
            width: pattern.size,
            height: pattern.size,
          }}
          animate={{
            rotate: [pattern.rotation, pattern.rotation + 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            delay: pattern.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <svg viewBox="0 0 50 50" fill="none" stroke="white" strokeWidth="2">
            {/* Traditional Amazigh geometric pattern */}
            <polygon points="25,5 45,25 25,45 5,25" />
            <line x1="25" y1="5" x2="25" y2="45" />
            <line x1="5" y1="25" x2="45" y2="25" />
          </svg>
        </motion.div>
      ))}

      {/* Yennayer celebration elements */}
      <motion.div
        className="absolute top-12 left-1/2 -translate-x-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20">
          <div className="text-center">
            <span className="text-3xl md:text-4xl font-bold text-white block">
              ⵣ يناير ⵣ
            </span>
            <span className="text-lg text-yellow-300 mt-2 block">
              Yennayer - رأس السنة الأمازيغية
            </span>
          </div>
        </div>
      </motion.div>

      {/* Traditional Amazigh items */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-around pb-8">
        {['🫒', '🌾', '🍯', '🥛', '🫒'].map((item, i) => (
          <motion.span
            key={i}
            className="text-4xl"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            {item}
          </motion.span>
        ))}
      </div>

      {/* Decorative border pattern */}
      <div className="absolute top-0 left-0 right-0 h-3 flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="flex-1 h-full"
            style={{ backgroundColor: i % 3 === 0 ? blue : i % 3 === 1 ? green : yellow }}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-3 flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i} 
            className="flex-1 h-full"
            style={{ backgroundColor: i % 3 === 0 ? yellow : i % 3 === 1 ? green : blue }}
          />
        ))}
      </div>

      {/* Occasion Badge */}
      <motion.div
        className="absolute top-4 right-4 bg-gradient-to-r from-blue-500/30 via-green-500/30 to-yellow-500/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-white text-sm font-semibold">ⵣ {occasionName}</span>
      </motion.div>
    </div>
  );
};

export default AmazighBackground;
