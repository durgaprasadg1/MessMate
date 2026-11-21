import { createRoute } from "@/lib/server/http/apiHandler";
import { json } from "@/lib/server/http/respond";
import supabase from "@/lib/supabaseClient";

/** Cheap DB ping for the GitHub keep-alive workflow. Returns no data. */
export const GET = createRoute({ name: "keepalive", auth: "public" }, async () => {
  const { error } = await supabase.from("mess").select("id").limit(1);
  if (error) throw error;
  return json({ ok: true });
});
