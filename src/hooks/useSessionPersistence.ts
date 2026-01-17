import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { saveSupabaseSession, loadSupabaseSession, clearSupabaseSession } from "@/utils/nativeStorage";

/**
 * Hook to ensure session persistence on native platforms
 * This handles the case where localStorage is cleared when the app is closed
 */
export const useSessionPersistence = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initSession = async () => {
      // Only run on native platforms
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Check if there's an existing session in Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          // Session exists, save it to native storage for backup
          await saveSupabaseSession(currentSession);
          console.log("Existing session backed up to native storage");
        } else {
          // No session in Supabase, try to restore from native storage
          const savedSession = await loadSupabaseSession();
          
          if (savedSession?.access_token && savedSession?.refresh_token) {
            console.log("Attempting to restore session from native storage...");
            
            // Try to set the session
            const { data, error } = await supabase.auth.setSession({
              access_token: savedSession.access_token,
              refresh_token: savedSession.refresh_token,
            });
            
            if (error) {
              console.error("Failed to restore session:", error);
              await clearSupabaseSession();
            } else if (data.session) {
              console.log("Session restored successfully");
              // Update the saved session with new tokens
              await saveSupabaseSession(data.session);
            }
          }
        }
      } catch (e) {
        console.error("Session initialization error:", e);
      }
    };

    initSession();

    // Listen for auth state changes and save session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!Capacitor.isNativePlatform()) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session) {
          saveSupabaseSession(session);
        }
      } else if (event === "SIGNED_OUT") {
        clearSupabaseSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
};
