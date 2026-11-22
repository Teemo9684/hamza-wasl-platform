import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// The administrator's Auth password is the single source of truth.
// No duplicate password secret is compared here, so a password reset can never drift out of sync.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password || password.length > 200) return json({ error: "Invalid credentials" }, 401);

    const adminEmail = Deno.env.get("ADMIN_EMAIL")?.trim().toLowerCase();
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!adminEmail) {
      console.error("ADMIN_EMAIL not configured");
      return json({ error: "Invalid credentials" }, 401);
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const user = list?.users.find((u) => u.email?.toLowerCase() === adminEmail);
    const { data: role } = user
      ? await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      : { data: null };
    console.log(`admin config check: listOk=${!listErr} userFound=${!!user} hasAdminRole=${!!role}`);
    if (!user || !role) return json({ error: "Invalid credentials" }, 401);

    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: auth, error: authErr } = await anon.auth.signInWithPassword({ email: adminEmail, password });
    if (authErr || auth.user?.id !== user.id) {
      console.warn("Admin login failed: password rejected by Auth");
      return json({ error: "Invalid credentials" }, 401);
    }
    await anon.auth.signOut();
    return json({ email: adminEmail, success: true }, 200);
  } catch (e) {
    console.error("admin-login error", e);
    return json({ error: "Invalid credentials" }, 401);
  }
});
