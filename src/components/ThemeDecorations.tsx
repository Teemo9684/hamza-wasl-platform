import { useTheme, ThemeName } from "@/contexts/ThemeContext";

// ============ SVG Components ============

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

const Star = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
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

const Confetti = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" style={style}>
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const Mosque = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 120 100" className={className} fill="currentColor" opacity="0.15">
    <path d="M60 5 Q40 20 40 35 L40 90 L80 90 L80 35 Q80 20 60 5Z" />
    <rect x="25" y="50" width="10" height="40" rx="5" />
    <rect x="85" y="50" width="10" height="40" rx="5" />
    <circle cx="60" cy="30" r="4" opacity="0.5" />
    <rect x="45" y="70" width="30" height="20" rx="10" opacity="0.3" />
  </svg>
);

const FlagStripe = ({ className = "", color }: { className?: string; color: string }) => (
  <div className={`absolute ${className}`} style={{ backgroundColor: color, opacity: 0.08 }} />
);

const Balloon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 60" className={className} fill="currentColor">
    <ellipse cx="20" cy="22" rx="14" ry="18" opacity="0.4" />
    <path d="M20 40 L18 55 M20 40 L22 55" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="none" />
  </svg>
);

const Sheep = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 50" className={className} fill="currentColor" opacity="0.12">
    <ellipse cx="30" cy="28" rx="18" ry="14" />
    <circle cx="30" cy="18" r="8" />
    <circle cx="25" cy="15" r="3" />
    <circle cx="35" cy="15" r="3" />
    <rect x="22" y="38" width="4" height="10" rx="2" />
    <rect x="34" y="38" width="4" height="10" rx="2" />
  </svg>
);

// ============ Ramadan Decorations ============
const RamadanDecor = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden backdrop-blur-[2px]">
    <div className="absolute top-20 right-8 md:right-16 theme-float">
      <CrescentMoon className="w-16 h-16 md:w-24 md:h-24 text-[hsl(45,80%,60%)] drop-shadow-[0_0_15px_rgba(218,165,32,0.4)]" />
    </div>
    {[[32,'15%','0s',3],[24,'35%','1.5s',2],[40,'75%','0.8s',4],[16,'55%','2.2s',2.5],[48,'85%','3s',2],[12,'40%','1s',3]].map(([top,left,delay,size],i) => (
      <div key={i} className={`absolute top-${top} theme-twinkle`} style={{ left: left as string, animationDelay: delay as string }}>
        <Star className={`w-${size} h-${size} text-[hsl(45,80%,70%)]`} />
      </div>
    ))}
    <div className="absolute top-0 left-8 md:left-20 theme-swing"><Lantern className="w-8 h-14 md:w-10 md:h-16 text-[hsl(45,80%,55%)]" /></div>
    <div className="absolute top-0 right-[30%] theme-swing" style={{ animationDelay: '1.2s' }}><Lantern className="w-6 h-10 md:w-8 md:h-14 text-[hsl(45,70%,50%)]" /></div>
    <div className="absolute bottom-10 left-5 opacity-30"><GeometricPattern className="w-24 h-24 md:w-32 md:h-32 text-[hsl(45,60%,50%)]" /></div>
    <div className="absolute bottom-20 right-5 opacity-20"><GeometricPattern className="w-20 h-20 md:w-28 md:h-28 text-[hsl(150,40%,40%)]" /></div>
  </div>
);

// ============ Eid Al-Fitr Decorations ============
const EidFitrDecor = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden backdrop-blur-[1px]">
    {/* Balloons */}
    <div className="absolute top-10 left-[10%] theme-float"><Balloon className="w-10 h-16 text-[hsl(340,70%,60%)]" /></div>
    <div className="absolute top-16 right-[15%] theme-float" style={{ animationDelay: '1.5s' }}><Balloon className="w-8 h-14 text-[hsl(45,80%,55%)]" /></div>
    <div className="absolute top-8 left-[50%] theme-float" style={{ animationDelay: '2.5s' }}><Balloon className="w-9 h-15 text-[hsl(150,60%,50%)]" /></div>
    {/* Confetti */}
    {[['12%','20%','0s','hsl(340,70%,65%)'],['25%','80%','0.5s','hsl(45,80%,60%)'],['8%','45%','1s','hsl(200,70%,60%)'],['30%','65%','1.5s','hsl(150,60%,55%)'],['18%','35%','2s','hsl(280,60%,60%)'],['22%','90%','0.8s','hsl(20,80%,60%)']].map(([top,left,delay,color],i) => (
      <div key={i} className="absolute theme-twinkle" style={{ top: top as string, left: left as string, animationDelay: delay as string }}>
        <Confetti className="w-2 h-2" style={{ color: color as string }} />
      </div>
    ))}
    {/* Crescent */}
    <div className="absolute top-20 right-8 theme-float" style={{ animationDelay: '0.5s' }}>
      <CrescentMoon className="w-12 h-12 md:w-16 md:h-16 text-[hsl(45,80%,60%)] drop-shadow-[0_0_10px_rgba(218,165,32,0.3)]" />
    </div>
    {/* Stars */}
    <div className="absolute top-28 left-[70%] theme-twinkle" style={{ animationDelay: '1.2s' }}><Star className="w-3 h-3 text-[hsl(45,80%,65%)]" /></div>
    <div className="absolute top-14 left-[30%] theme-twinkle" style={{ animationDelay: '2s' }}><Star className="w-2.5 h-2.5 text-[hsl(45,70%,70%)]" /></div>
    <div className="absolute bottom-16 left-8 opacity-25"><GeometricPattern className="w-20 h-20 text-[hsl(340,50%,50%)]" /></div>
  </div>
);

// ============ Eid Al-Adha Decorations ============
const EidAdhaDecor = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden backdrop-blur-[1px]">
    <div className="absolute top-20 right-8 md:right-16 theme-float">
      <CrescentMoon className="w-14 h-14 md:w-20 md:h-20 text-[hsl(30,60%,55%)] drop-shadow-[0_0_12px_rgba(180,120,50,0.3)]" />
    </div>
    <div className="absolute bottom-16 right-[15%] opacity-40"><Sheep className="w-20 h-16 md:w-28 md:h-22 text-[hsl(30,20%,70%)]" /></div>
    <div className="absolute bottom-24 left-[10%] opacity-30"><Sheep className="w-16 h-14 md:w-22 md:h-18 text-[hsl(30,15%,65%)]" /></div>
    {/* Mosque */}
    <div className="absolute top-12 left-[8%]"><Mosque className="w-24 h-20 md:w-32 md:h-28 text-[hsl(30,50%,50%)]" /></div>
    {/* Stars */}
    {[['24','20%','0s'],['16','50%','1.2s'],['36','75%','2s'],['12','65%','0.5s']].map(([top,left,delay],i) => (
      <div key={i} className={`absolute top-${top} theme-twinkle`} style={{ left: left as string, animationDelay: delay as string }}>
        <Star className="w-2.5 h-2.5 text-[hsl(30,60%,65%)]" />
      </div>
    ))}
    <div className="absolute bottom-8 right-5 opacity-20"><GeometricPattern className="w-24 h-24 text-[hsl(30,50%,45%)]" /></div>
    <div className="absolute top-0 right-[25%] theme-swing"><Lantern className="w-7 h-12 text-[hsl(30,60%,50%)]" /></div>
  </div>
);

// ============ Mawlid Decorations ============
const MawlidDecor = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden backdrop-blur-[1px]">
    <div className="absolute top-16 left-[5%]"><Mosque className="w-28 h-24 md:w-36 md:h-30 text-[hsl(150,40%,45%)]" /></div>
    <div className="absolute top-20 right-8 theme-float">
      <CrescentMoon className="w-14 h-14 md:w-20 md:h-20 text-[hsl(150,50%,55%)] drop-shadow-[0_0_12px_rgba(50,150,80,0.3)]" />
    </div>
    {/* Green stars */}
    {[['28','25%','0s'],['18','55%','1s'],['40','80%','1.8s'],['14','40%','2.5s'],['34','15%','0.7s']].map(([top,left,delay],i) => (
      <div key={i} className={`absolute top-${top} theme-twinkle`} style={{ left: left as string, animationDelay: delay as string }}>
        <Star className="w-3 h-3 text-[hsl(150,50%,60%)]" />
      </div>
    ))}
    <div className="absolute top-0 left-[20%] theme-swing"><Lantern className="w-7 h-12 text-[hsl(150,50%,45%)]" /></div>
    <div className="absolute top-0 right-[35%] theme-swing" style={{ animationDelay: '1.5s' }}><Lantern className="w-6 h-10 text-[hsl(150,40%,50%)]" /></div>
    <div className="absolute bottom-12 right-8 opacity-25"><GeometricPattern className="w-24 h-24 text-[hsl(150,40%,45%)]" /></div>
    <div className="absolute bottom-24 left-5 opacity-20"><GeometricPattern className="w-20 h-20 text-[hsl(150,30%,50%)]" /></div>
  </div>
);

// ============ Independence Day Decorations ============
const IndependenceDecor = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden backdrop-blur-[1px]">
    {/* Flag stripes */}
    <FlagStripe className="top-0 left-0 w-1/2 h-full" color="hsl(150,70%,30%)" />
    <FlagStripe className="top-0 right-0 w-1/2 h-full" color="hsl(0,0%,95%)" />
    {/* Central crescent and star */}
    <div className="absolute top-20 left-1/2 -translate-x-1/2 theme-float">
      <CrescentMoon className="w-16 h-16 md:w-24 md:h-24 text-[hsl(0,70%,45%)] drop-shadow-[0_0_15px_rgba(200,50,50,0.3)]" />
    </div>
    <div className="absolute top-24 left-[52%] theme-twinkle">
      <Star className="w-6 h-6 md:w-8 md:h-8 text-[hsl(0,70%,45%)]" />
    </div>
    {/* Stars scattered */}
    {[['36','20%','0s','hsl(150,60%,40%)'],['14','75%','1s','hsl(0,60%,50%)'],['44','85%','1.5s','hsl(150,60%,40%)'],['28','10%','2s','hsl(0,60%,50%)']].map(([top,left,delay,color],i) => (
      <div key={i} className={`absolute top-${top} theme-twinkle`} style={{ left: left as string, animationDelay: delay as string }}>
        <Star className="w-3 h-3" style={{ color: color as string }} />
      </div>
    ))}
    {/* 1962 */}
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-10">
      <span className="text-6xl md:text-8xl font-bold text-[hsl(150,60%,35%)] font-cairo">1962</span>
    </div>
  </div>
);

// ============ Banner Messages ============
const BANNER_TEXT: Record<string, { title: string; subtitle: string; emoji: string }> = {
  ramadan: { title: 'رمضان مبارك', subtitle: 'تقبل الله منا ومنكم صالح الأعمال', emoji: '☪' },
  'eid-fitr': { title: 'عيد فطر مبارك', subtitle: 'كل عام وأنتم بخير', emoji: '🎉' },
  'eid-adha': { title: 'عيد أضحى مبارك', subtitle: 'تقبل الله منا ومنكم', emoji: '🐑' },
  mawlid: { title: 'ذكرى المولد النبوي الشريف', subtitle: 'صلى الله عليه وسلم', emoji: '🕌' },
  independence: { title: 'عيد الاستقلال', subtitle: 'المجد والخلود لشهدائنا الأبرار', emoji: '🇩🇿' },
};

// ============ Exports ============
export const ThemeDecorations = () => {
  const { activeTheme } = useTheme();
  if (!activeTheme) return null;

  switch (activeTheme) {
    case 'ramadan': return <RamadanDecor />;
    case 'eid-fitr': return <EidFitrDecor />;
    case 'eid-adha': return <EidAdhaDecor />;
    case 'mawlid': return <MawlidDecor />;
    case 'independence': return <IndependenceDecor />;
    default: return null;
  }
};

export const ThemeBanner = () => {
  const { activeTheme } = useTheme();
  if (!activeTheme || !BANNER_TEXT[activeTheme]) return null;

  const { title, subtitle, emoji } = BANNER_TEXT[activeTheme];
  const colorMap: Record<string, string> = {
    ramadan: 'hsl(45,70%,70%)',
    'eid-fitr': 'hsl(340,60%,70%)',
    'eid-adha': 'hsl(30,60%,65%)',
    mawlid: 'hsl(150,50%,60%)',
    independence: 'hsl(150,60%,45%)',
  };
  const subColorMap: Record<string, string> = {
    ramadan: 'hsl(45,50%,60%)',
    'eid-fitr': 'hsl(340,40%,60%)',
    'eid-adha': 'hsl(30,40%,55%)',
    mawlid: 'hsl(150,35%,50%)',
    independence: 'hsl(0,60%,50%)',
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 px-4 text-center">
      <p className="text-lg md:text-xl font-bold font-cairo leading-relaxed drop-shadow-[0_0_10px_rgba(218,165,32,0.3)]" style={{ color: colorMap[activeTheme] }}>
        {emoji} {title} {emoji}
      </p>
      <p className="text-sm md:text-base font-cairo mt-1 drop-shadow-[0_0_8px_rgba(218,165,32,0.2)]" style={{ color: subColorMap[activeTheme] }}>
        {subtitle}
      </p>
    </div>
  );
};

// Re-exports for backwards compatibility
export const RamadanDecorations = ThemeDecorations;
export const RamadanBanner = ThemeBanner;
