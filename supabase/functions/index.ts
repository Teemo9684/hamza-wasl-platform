// Minimal public edge function placeholder to satisfy the build system.
// You can create more functions here when needed.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve((_req) => new Response("OK", { status: 200 }));
