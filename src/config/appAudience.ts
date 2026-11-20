/**
 * Separate frontends built from the same school platform.
 * "combined" retains the historical 1.2.75 pilot experience unchanged.
 * Each separated deployment must set VITE_APP_AUDIENCE explicitly.
 */
export type AppAudience = "combined" | "parent" | "teacher" | "admin";

const configured = import.meta.env.VITE_APP_AUDIENCE;

export const APP_AUDIENCE: AppAudience =
  configured === "parent" || configured === "teacher" || configured === "admin"
    ? configured
    : "combined";

export const isAudienceEnabled = (role: Exclude<AppAudience, "combined">) =>
  APP_AUDIENCE === "combined" || APP_AUDIENCE === role;
