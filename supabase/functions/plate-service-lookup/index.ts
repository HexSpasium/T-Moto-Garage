import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    let vehicleQuery = admin.from("vehicles")
      .select("id, plate, qr_token, make, model, production_year")
      .eq("is_published", true);

    if (typeof body.qr_token === "string" && body.qr_token.length <= 64) {
      vehicleQuery = vehicleQuery.eq("qr_token", body.qr_token);
    } else if (typeof body.plate === "string") {
      const plate = normalizePlate(body.plate);
      if (plate.length < 5 || plate.length > 12) return json({ error: "Invalid lookup" }, 400);
    } else {
      return json({ error: "Invalid lookup" }, 400);
    }

    const { data: vehicles, error: vehicleError } = await vehicleQuery;
    if (vehicleError) {
      console.error("Vehicle lookup failed", vehicleError.message);
      return json({ error: "Lookup unavailable" }, 500);
    }
    let matches = vehicles || [];
    if (typeof body.plate === "string" && typeof body.qr_token !== "string") {
      const plate = normalizePlate(body.plate);
      matches = matches.filter((v: any) => normalizePlate(v.plate || "") === plate);
    }
    if (matches.length !== 1) return json({ error: "No matching published record" }, 404);
    const vehicle = matches[0];

    const { data: history, error: historyError } = await admin.rpc("get_public_service_history", { p_qr_token: vehicle.qr_token });
    if (historyError) {
      console.error("Service history query failed", historyError.message);
      return json({ error: "History unavailable" }, 500);
    }
    if (!history) return json({ error: "No published service history" }, 404);

    const { data: media, error: mediaError } = await admin
      .from("vehicle_media").select("storage_path, caption")
      .eq("vehicle_id", vehicle.id).order("created_at", { ascending: true });
    if (mediaError) {
      console.error("Vehicle media lookup failed", mediaError.message);
    }
    const images = await Promise.all((media || []).map(async (item: any) => {
      const { data, error } = await admin.storage.from("tmoto-private-media")
        .createSignedUrl(item.storage_path, 3600);
      if (error || !data?.signedUrl) return null;
      return { url: data.signedUrl, caption: item.caption || null };
    }));

    history.vehicle = {
      ...history.vehicle,
      images: images.filter(Boolean),
    };
    return json({ history });
  } catch (error) {
    console.error("Public vehicle lookup failed", error);
    return json({ error: "Lookup unavailable" }, 500);
  }
});
