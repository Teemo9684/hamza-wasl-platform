import { useEffect, useState } from "react";
import { Cloud, MapPin, Clock } from "lucide-react";

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

  return (
    <div className="w-full bg-primary/5 backdrop-blur-sm border-b border-primary/10 overflow-hidden">
      <div className="container mx-auto px-4 py-1.5">
        <div className="flex items-center justify-between gap-4 text-xs md:text-sm font-cairo">
          {/* Location Info */}
          <div className="flex items-center gap-2 text-foreground/80">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold">ولاية خنشلة - الجزائر</span>
          </div>

          {/* Weather Info Placeholder */}
          <div className="hidden md:flex items-center gap-2 text-foreground/70">
            <Cloud className="h-4 w-4 text-primary/70" />
            <span>الطقس: صحو</span>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-3 text-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-bold tabular-nums" dir="ltr">{formatTime(currentTime)}</span>
            </div>
            <span className="hidden lg:inline text-foreground/60">{formatDate(currentTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
