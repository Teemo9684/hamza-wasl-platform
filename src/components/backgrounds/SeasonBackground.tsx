import React from 'react';
import { motion } from 'framer-motion';

interface SeasonBackgroundProps {
  occasionType: string;
  occasionName: string;
}

const SeasonBackground: React.FC<SeasonBackgroundProps> = ({ occasionType, occasionName }) => {
  const isWinter = occasionType === 'winter' || occasionType === 'winter_vacation';
  const isSpring = occasionType === 'spring' || occasionType === 'spring_vacation';
  const isSummer = occasionType === 'summer';
  const isAutumn = occasionType === 'autumn';

  // Generate seasonal particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 8,
    size: 10 + Math.random() * 15,
  }));

  const getParticleContent = () => {
    if (isWinter) return ['❄️', '❅', '❆', '🌨️'][Math.floor(Math.random() * 4)];
    if (isSpring) return ['🌸', '🌺', '🌷', '🌼', '🦋'][Math.floor(Math.random() * 5)];
    if (isSummer) return ['☀️', '🌻', '🌴', '🏖️'][Math.floor(Math.random() * 4)];
    if (isAutumn) return ['🍂', '🍁', '🍃', '🌾'][Math.floor(Math.random() * 4)];
    return '✨';
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Season-specific gradient backgrounds */}
      {isWinter && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(ellipse at 30% 20%, rgba(147,197,253,0.2) 0%, transparent 50%)',
                'radial-gradient(ellipse at 70% 40%, rgba(147,197,253,0.2) 0%, transparent 50%)',
                'radial-gradient(ellipse at 30% 20%, rgba(147,197,253,0.2) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {isSpring && (
        <div className="absolute inset-0 bg-gradient-to-b from-pink-900 via-rose-800 to-fuchsia-900">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(ellipse at 20% 30%, rgba(244,114,182,0.3) 0%, transparent 50%)',
                'radial-gradient(ellipse at 80% 50%, rgba(192,132,252,0.3) 0%, transparent 50%)',
                'radial-gradient(ellipse at 20% 30%, rgba(244,114,182,0.3) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {isSummer && (
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900 via-amber-800 to-yellow-900">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.4) 0%, transparent 50%)',
                'radial-gradient(ellipse at 50% 10%, rgba(251,191,36,0.5) 0%, transparent 60%)',
                'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.4) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {isAutumn && (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900 via-orange-800 to-red-900">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(ellipse at 30% 40%, rgba(234,88,12,0.2) 0%, transparent 50%)',
                'radial-gradient(ellipse at 70% 60%, rgba(180,83,9,0.2) 0%, transparent 50%)',
                'radial-gradient(ellipse at 30% 40%, rgba(234,88,12,0.2) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* Default gradient fallback */}
      {!isWinter && !isSpring && !isSummer && !isAutumn && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900" />
      )}

      {/* Seasonal particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute pointer-events-none"
          style={{
            left: particle.left,
            top: -50,
            fontSize: particle.size,
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: isWinter || isAutumn ? [0, 30, -20, 10, 0] : [0, 10, -10, 0],
            rotate: isAutumn ? [0, 360] : [0, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {getParticleContent()}
        </motion.div>
      ))}

      {/* Winter specific: Ground snow */}
      {isWinter && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/30 to-transparent" />
      )}

      {/* Summer specific: Sun */}
      {isSummer && (
        <motion.div
          className="absolute top-8 left-1/2 -translate-x-1/2"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <span className="text-6xl md:text-8xl">☀️</span>
        </motion.div>
      )}

      {/* Spring specific: Flowers at bottom */}
      {isSpring && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-around pb-4">
          {['🌷', '🌻', '🌸', '🌺', '🌼', '🌷', '🌻', '🌸'].map((flower, i) => (
            <motion.span
              key={i}
              className="text-3xl"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
            >
              {flower}
            </motion.span>
          ))}
        </div>
      )}

      {/* Autumn specific: Pumpkins */}
      {isAutumn && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-around">
          {['🎃', '🍂', '🌾', '🍁', '🎃'].map((item, i) => (
            <motion.span
              key={i}
              className="text-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
            >
              {item}
            </motion.span>
          ))}
        </div>
      )}

      {/* Occasion Badge */}
      <motion.div
        className={`absolute top-4 right-4 backdrop-blur-sm rounded-full px-4 py-2 border ${
          isWinter ? 'bg-blue-500/20 border-blue-400/30' :
          isSpring ? 'bg-pink-500/20 border-pink-400/30' :
          isSummer ? 'bg-amber-500/20 border-amber-400/30' :
          'bg-orange-500/20 border-orange-400/30'
        }`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-white text-sm font-semibold">
          {isWinter && '❄️'} {isSpring && '🌸'} {isSummer && '☀️'} {isAutumn && '🍂'} {occasionName}
        </span>
      </motion.div>
    </div>
  );
};

export default SeasonBackground;
