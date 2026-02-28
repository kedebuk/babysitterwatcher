import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(hash));
}

async function hashUserData(userData: Record<string, any>): Promise<Record<string, any>> {
  const hashed: Record<string, any> = {};

  // Hash standard fields per Meta spec
  if (userData.em) hashed.em = [await sha256(userData.em)];
  if (userData.ph) hashed.ph = [await sha256(userData.ph)];
  if (userData.fn) hashed.fn = [await sha256(userData.fn)];
  if (userData.ln) hashed.ln = [await sha256(userData.ln)];
  
  // Pass through non-hashed fields
  if (userData.client_ip_address) hashed.client_ip_address = userData.client_ip_address;
  if (userData.client_user_agent) hashed.client_user_agent = userData.client_user_agent;
  if (userData.fbc) hashed.fbc = userData.fbc;
  if (userData.fbp) hashed.fbp = userData.fbp;
  if (userData.external_id) hashed.external_id = [await sha256(userData.external_id)];

  return hashed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_name, event_time, user_data, custom_data, event_source_url, action_source, test_event_code } =
      await req.json();

    if (!event_name) {
      return new Response(
        JSON.stringify({ error: "event_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read CAPI credentials from app_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["meta_capi_dataset_id", "meta_capi_access_token"]);

    if (settingsError) {
      throw new Error(`Failed to load settings: ${settingsError.message}`);
    }

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((row: any) => {
      settingsMap[row.key] = row.value;
    });

    const datasetId = settingsMap.meta_capi_dataset_id;
    const accessToken = settingsMap.meta_capi_access_token;

    if (!datasetId || !accessToken) {
      return new Response(
        JSON.stringify({ error: "Meta CAPI not configured. Set Dataset ID and Access Token in Admin Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash user data per Meta requirements
    const hashedUserData = user_data ? await hashUserData(user_data) : {};

    // Ensure minimum user data for Meta (client_user_agent at minimum)
    if (!hashedUserData.client_user_agent) {
      hashedUserData.client_user_agent = req.headers.get("user-agent") || "unknown";
    }
    if (!hashedUserData.client_ip_address) {
      hashedUserData.client_ip_address = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    }

    // Build event payload
    const eventData: Record<string, any> = {
      event_name,
      event_time: event_time || Math.floor(Date.now() / 1000),
      action_source: action_source || "website",
      user_data: hashedUserData,
    };

    if (event_source_url) eventData.event_source_url = event_source_url;
    if (custom_data) eventData.custom_data = custom_data;

    const body: Record<string, any> = { data: [eventData] };
    if (test_event_code) body.test_event_code = test_event_code;

    // Send to Meta Conversions API
    const metaUrl = `https://graph.facebook.com/v21.0/${datasetId}/events?access_token=${accessToken}`;

    const metaResponse = await fetch(metaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error("Meta CAPI error:", JSON.stringify(metaResult));
      return new Response(
        JSON.stringify({ error: "Meta CAPI request failed", details: metaResult }),
        { status: metaResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, meta_response: metaResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("CAPI edge function error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
