import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export const DateTimeBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const gregorianDate = format(currentTime, "EEEE، d MMMM yyyy", { locale: ar });
  const time = format(currentTime, "HH:mm:ss");
  
  // Convert to Hijri using a simple approximation
  const getHijriDate = (date: Date) => {
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();
    
    // Simple Hijri conversion approximation
    const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);
    const hijriMonth = Math.floor(((gregorianMonth - 1) * 29.5) / 30) + 1;
    const hijriDay = gregorianDay;
    
    const months = [
      "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
      "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
      "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ];
    
    return `${hijriDay} ${months[hijriMonth - 1]} ${hijriYear}`;
  };

  const hijriDate = getHijriDate(currentTime);

  return (
    <div className="w-full bg-primary/5 backdrop-blur-sm border-b border-primary/10">
      <div className="py-2 px-4 flex justify-center items-center gap-6 flex-wrap text-sm font-cairo">
        <span className="text-foreground/80 flex items-center gap-2">
          <span className="text-primary font-bold">⏰</span>
          {time}
        </span>
        <span className="text-foreground/60">•</span>
        <span className="text-foreground/80 flex items-center gap-2">
          <span className="text-primary font-bold">📅</span>
          {gregorianDate}
        </span>
        <span className="text-foreground/60">•</span>
        <span className="text-foreground/80 flex items-center gap-2">
          <span className="text-primary font-bold">🌙</span>
          {hijriDate}
        </span>
      </div>
    </div>
  );
};
