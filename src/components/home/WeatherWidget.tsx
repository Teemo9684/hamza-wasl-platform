import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, Wind, Thermometer, Snowflake, CloudSun, Shirt } from "lucide-react";
import { motion } from "framer-motion";

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

// Map weather conditions to icons
const getWeatherIcon = (condition: string) => {
  const lower = condition.toLowerCase();
  if (lower.includes("rain") || lower.includes("مطر")) return CloudRain;
  if (lower.includes("cloud") || lower.includes("غائم")) return Cloud;
  if (lower.includes("snow") || lower.includes("ثلج")) return Snowflake;
  if (lower.includes("partly") || lower.includes("جزئي")) return CloudSun;
  if (lower.includes("wind") || lower.includes("رياح")) return Wind;
  return Sun;
};

// Get clothing suggestion based on temperature
const getClothingSuggestion = (temp: number): string => {
  if (temp <= 5) return "ملابس شتوية ثقيلة ومعطف دافئ 🧥🧣";
  if (temp <= 10) return "معطف أو سترة دافئة 🧥";
  if (temp <= 18) return "سترة خفيفة أو كنزة 🧶";
  if (temp <= 25) return "ملابس ربيعية خفيفة 👕";
  if (temp <= 32) return "ملابس صيفية قطنية ☀️";
  return "ملابس خفيفة جداً وقبعة للشمس 🎩";
};

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      // Using wttr.in free API (no key required)
      // Tébessa, Algeria coordinates
      const response = await fetch(
        "https://wttr.in/Tebessa,Algeria?format=j1",
        { headers: { "Accept": "application/json" } }
      );
      
      if (!response.ok) throw new Error("Weather fetch failed");
      
      const data = await response.json();
      const current = data.current_condition[0];
      
      setWeather({
        temp: parseInt(current.temp_C),
        condition: current.weatherDesc[0].value,
        icon: current.weatherIconUrl[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseInt(current.windspeedKmph),
      });
    } catch (err) {
      console.error("Error fetching weather:", err);
      // Fallback to simulated data
      setWeather({
        temp: 18,
        condition: "صافٍ",
        icon: "",
        humidity: 45,
        windSpeed: 12,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl backdrop-blur-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/20 p-4 animate-pulse">
        <div className="h-24" />
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.condition);
  const clothingSuggestion = getClothingSuggestion(weather.temp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl backdrop-blur-lg bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-sky-500/20 border border-white/20 p-4"
    >
      {/* Animated clouds in background */}
      <div className="absolute -top-2 -right-4 opacity-20">
        <Cloud className="w-16 h-16 text-white animate-pulse" />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-full bg-blue-400/30">
          <WeatherIcon className="w-5 h-5 text-blue-300" />
        </div>
        <h3 className="text-white font-bold font-cairo text-sm">
          🌤️ الطقس في تبسة
        </h3>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-6 h-6 text-red-300" />
          <span className="text-3xl font-bold text-white">{weather.temp}°</span>
        </div>
        <div className="text-right">
          <p className="text-white/80 text-sm font-cairo">{weather.condition}</p>
          <p className="text-white/60 text-xs font-cairo">
            💧 {weather.humidity}% | 💨 {weather.windSpeed} كم/س
          </p>
        </div>
      </div>

      {/* Clothing suggestion */}
      <div className="flex items-start gap-2 bg-white/10 rounded-lg p-2">
        <Shirt className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
        <p className="text-white/80 text-xs font-cairo leading-relaxed">
          <span className="font-bold">نوصي:</span> {clothingSuggestion}
        </p>
      </div>

      {/* Temperature indicator bar */}
      <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((weather.temp + 10) * 2, 100)}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={`h-full rounded-full ${
            weather.temp < 10
              ? "bg-blue-400"
              : weather.temp < 20
              ? "bg-green-400"
              : weather.temp < 30
              ? "bg-yellow-400"
              : "bg-red-400"
          }`}
        />
      </div>
    </motion.div>
  );
};
