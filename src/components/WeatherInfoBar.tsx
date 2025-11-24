import { useEffect, useState } from "react";
import { Cloud, MapPin, Clock, Thermometer, Info } from "lucide-react";

export const WeatherInfoBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-DZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-DZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // معلومات عن ولاية خنشلة
  const khenchelaInfo = {
    location: "الشرق الشمالي الجزائري - منطقة الأوراس",
    wilayaNumber: "الولاية رقم 40",
    weather: "صحو",
    temperature: "29°م",
    neighbors: "تبسة، أم البواقي، باتنة، بسكرة",
  };

  return (
    <div className="w-full bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 backdrop-blur-sm border-b border-primary/10 overflow-hidden">
      <div className="container mx-auto px-3 py-1.5">
        <div className="flex items-center justify-between gap-3 text-xs font-cairo overflow-x-auto scrollbar-hide">
          {/* Location and Info */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-foreground/90">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold">ولاية خنشلة</span>
              <span className="text-foreground/60">({khenchelaInfo.wilayaNumber})</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5 text-foreground/70">
              <Info className="h-3 w-3 text-accent" />
              <span className="text-[10px]">{khenchelaInfo.location}</span>
            </div>
          </div>

          {/* Weather Info */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-foreground/80">
              <Cloud className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-semibold">{khenchelaInfo.weather}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-foreground/80">
              <Thermometer className="h-3.5 w-3.5 text-red-500" />
              <span className="font-bold">{khenchelaInfo.temperature}</span>
            </div>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-3 text-foreground flex-shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold tabular-nums" dir="ltr">{formatTime(currentTime)}</span>
            </div>
            <span className="hidden xl:inline text-foreground/60 text-[10px]">{formatDate(currentTime)}</span>
          </div>
        </div>
        
        {/* Additional Info - Scrolling Text */}
        <div className="mt-1 overflow-hidden">
          <div className="ticker-animation-slow inline-flex whitespace-nowrap">
            {[...Array(3)].map((_, idx) => (
              <span key={idx} className="text-[10px] text-foreground/50 mr-8">
                📍 الولايات المجاورة: {khenchelaInfo.neighbors} • منطقة الأوراس التاريخية • عاصمة الولاية: خنشلة • مساحة واسعة وطبيعة خلابة
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
