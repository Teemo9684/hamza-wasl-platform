import { useTheme } from "@/contexts/ThemeContext";

const CrescentMoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50 5C30 5 13 22 13 42c0 20 17 37 37 37 8 0 15-2.5 21-7-5 3-11 5-17 5-18 0-33-15-33-33s15-33 33-33c6 0 12 2 17 5C65 7.5 58 5 50 5z" />
  </svg>
);

const Lantern = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 100" className={className} fill="currentColor">
    <rect x="22" y="0" width="16" height="8" rx="2" opacity="0.7" />
    <line x1="30" y1="8" x2="30" y2="18" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    <path d="M15 18 Q15 12 30 12 Q45 12 45 18 L48 70 Q48 85 30 85 Q12 85 12 70 Z" opacity="0.3" />
    <path d="M20 25 Q20 20 30 20 Q40 20 40 25 L42 65 Q42 75 30 75 Q18 75 18 65 Z" opacity="0.2" />
    <ellipse cx="30" cy="45" rx="4" ry="6" opacity="0.6" />
  </svg>
);

const Star = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2l2.09 6.26L20.18 9l-4.64 4.27L16.82 20 12 16.9 7.18 20l1.27-6.73L3.82 9l6.09-.74z" />
  </svg>
);

const GeometricPattern = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="0.5">
    <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" opacity="0.15" />
    <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" opacity="0.1" />
    <polygon points="50,30 70,40 70,60 50,70 30,60 30,40" opacity="0.08" />
  </svg>
);

export const RamadanDecorations = () => {
  const { isRamadanMode } = useTheme();

  if (!isRamadanMode) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {/* Crescent Moon - top right */}
      <div className="absolute top-20 right-8 md:right-16 ramadan-float">
        <CrescentMoon className="w-16 h-16 md:w-24 md:h-24 text-[hsl(45,80%,60%)] drop-shadow-[0_0_15px_rgba(218,165,32,0.4)]" />
      </div>

      {/* Stars */}
      <div className="absolute top-32 left-[15%] ramadan-twinkle" style={{ animationDelay: '0s' }}>
        <Star className="w-3 h-3 text-[hsl(45,80%,70%)]" />
      </div>
      <div className="absolute top-24 left-[35%] ramadan-twinkle" style={{ animationDelay: '1.5s' }}>
        <Star className="w-2 h-2 text-[hsl(45,80%,75%)]" />
      </div>
      <div className="absolute top-40 right-[25%] ramadan-twinkle" style={{ animationDelay: '0.8s' }}>
        <Star className="w-4 h-4 text-[hsl(45,80%,65%)]" />
      </div>
      <div className="absolute top-16 left-[55%] ramadan-twinkle" style={{ animationDelay: '2.2s' }}>
        <Star className="w-2.5 h-2.5 text-[hsl(45,80%,70%)]" />
      </div>
      <div className="absolute top-48 left-[75%] ramadan-twinkle" style={{ animationDelay: '3s' }}>
        <Star className="w-2 h-2 text-[hsl(45,80%,80%)]" />
      </div>
      <div className="absolute top-12 right-[40%] ramadan-twinkle" style={{ animationDelay: '1s' }}>
        <Star className="w-3 h-3 text-[hsl(45,80%,65%)]" />
      </div>

      {/* Lanterns */}
      <div className="absolute top-0 left-8 md:left-20 ramadan-swing" style={{ animationDelay: '0s' }}>
        <Lantern className="w-8 h-14 md:w-10 md:h-16 text-[hsl(45,80%,55%)]" />
      </div>
      <div className="absolute top-0 right-[30%] ramadan-swing" style={{ animationDelay: '1.2s' }}>
        <Lantern className="w-6 h-10 md:w-8 md:h-14 text-[hsl(45,70%,50%)]" />
      </div>

      {/* Geometric Patterns - corners */}
      <div className="absolute bottom-10 left-5 opacity-30">
        <GeometricPattern className="w-24 h-24 md:w-32 md:h-32 text-[hsl(45,60%,50%)]" />
      </div>
      <div className="absolute bottom-20 right-5 opacity-20">
        <GeometricPattern className="w-20 h-20 md:w-28 md:h-28 text-[hsl(150,40%,40%)]" />
      </div>
    </div>
  );
};

export const RamadanBanner = () => {
  const { isRamadanMode } = useTheme();

  if (!isRamadanMode) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 px-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(150,40%,20%)] via-[hsl(230,40%,20%)] to-[hsl(150,40%,20%)] border border-[hsl(45,60%,40%)]/30 px-6 py-4 text-center shadow-[0_0_30px_rgba(218,165,32,0.15)]">
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(45,80%,50%)]/5 to-transparent" />
        
        <p className="relative text-lg md:text-xl font-bold font-cairo text-[hsl(45,70%,70%)] leading-relaxed">
          ☪ رمضان مبارك ☪
        </p>
        <p className="relative text-sm md:text-base font-cairo text-[hsl(45,50%,60%)] mt-1">
          تقبل الله منا ومنكم صالح الأعمال
        </p>
      </div>
    </div>
  );
};
