import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePlate(value: string) {
  return value.toLocaleUpperCase("tr-TR").replace(/[^A-Z0-9]/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Server configuration unavailable" }, 500);

    const body = await req.json();
    const plate = typeof body.plate === "string" ? normalizePlate(body.plate) : "";
    if (plate.length < 5 || plate.length > 12) return json({ error: "Invalid lookup" }, 400);

    // Public plate lookup is intentionally limited to published vehicles and the
    // existing public-history RPC. Customer contact data is never returned.
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: vehicles, error: vehicleError } = await admin
      .from("vehicles")
      .select("plate, qr_token")
      .eq("is_published", true);

    if (vehicleError) {
      console.error("Plate lookup query failed", vehicleError.message);
      return json({ error: "Lookup unavailable" }, 500);
    }

    const matches = (vehicles || []).filter((vehicle: any) =>
      normalizePlate(vehicle.plate || "") === plate
    );

    // Do not disclose whether an unpublished vehicle exists.
    if (matches.length !== 1) return json({ error: "No matching published record" }, 404);

    const { data: history, error: historyError } = await admin.rpc(
      "get_public_service_history",
      { p_qr_token: matches[0].qr_token },
    );

    if (historyError) {
      console.error("Service history query failed", historyError.message);
      return json({ error: "History unavailable" }, 500);
    }
    if (!history) return json({ error: "No published service history" }, 404);

    return json({ history });
  } catch (error) {
    console.error("Plate lookup failed", error);
    return json({ error: "Lookup unavailable" }, 500);
  }
});
