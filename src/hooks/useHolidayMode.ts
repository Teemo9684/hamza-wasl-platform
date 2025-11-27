import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HolidayModeSettings {
  enabled: boolean;
  message: string;
}

export const useHolidayMode = () => {
  const [isHolidayMode, setIsHolidayMode] = useState(false);
  const [holidayMessage, setHolidayMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHolidayMode();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("holiday_mode_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
          filter: "setting_key=eq.holiday_mode",
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object" && "setting_value" in payload.new) {
            const settings = payload.new.setting_value as HolidayModeSettings;
            setIsHolidayMode(settings.enabled);
            setHolidayMessage(settings.message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkHolidayMode = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "holiday_mode")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const settings = data.setting_value as unknown as HolidayModeSettings;
        setIsHolidayMode(settings.enabled);
        setHolidayMessage(settings.message);
      }
    } catch (error) {
      console.error("Error checking holiday mode:", error);
    } finally {
      setLoading(false);
    }
  };

  return { isHolidayMode, holidayMessage, loading };
};