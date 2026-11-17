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

function normalizePhone(value: string | null | undefined) {
  let digits = (value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "90" + digits.slice(1);
  if (digits.length === 10) digits = "90" + digits;
  return digits;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration unavailable" }, 500);

    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Authentication required" }, 401);

    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user?.phone) return json({ error: "Verified phone required" }, 401);

    const body = await req.json();
    const plate = typeof body.plate === "string" ? normalizePlate(body.plate) : "";
    if (plate.length < 5 || plate.length > 12) return json({ error: "Invalid lookup" }, 400);

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Read the vehicle and linked customer only on the server; never return phone data.
    const { data: vehicles, error: vehicleError } = await admin
      .from("vehicles")
      .select("id, plate, qr_token, is_published, customer_id, customers(phone)")
      .eq("is_published", true);

    if (vehicleError) {
      console.error("Plate lookup query failed", vehicleError.message);
      return json({ error: "Lookup unavailable" }, 500);
    }

    const matches = (vehicles || []).filter((vehicle: any) =>
      normalizePlate(vehicle.plate || "") === plate &&
      vehicle.customer_id &&
      normalizePhone(vehicle.customers?.phone) === normalizePhone(authData.user.phone)
    );

    // A generic response prevents plate or customer enumeration.
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
