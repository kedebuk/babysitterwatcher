import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { child_id, date, zodiac_sign, shio, mood, element } = await req.json();
    if (!child_id) throw new Error("child_id is required");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: child, error: childError } = await supabase.from("children").select("name, dob").eq("id", child_id).single();
    if (childError || !child) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get today's events
    const logDate = date || new Date().toISOString().split("T")[0];
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("id, notes")
      .eq("child_id", child_id)
      .eq("log_date", logDate)
      .limit(1);

    let events: any[] = [];
    if (logs && logs.length > 0) {
      const { data: evts } = await supabase
        .from("events")
        .select("time, type, detail, amount, unit")
        .eq("daily_log_id", logs[0].id)
        .order("time");
      events = evts || [];
    }

    const eventSummary = events.length > 0
      ? events.map(e => `${e.time?.substring(0, 5)} ${e.type}${e.amount ? ` ${e.amount}${e.unit || ''}` : ''}${e.detail ? ` (${e.detail})` : ''}`).join(", ")
      : "Belum ada aktivitas tercatat hari ini";

    const prompt = `Kamu adalah peramal bintang lucu untuk bayi/balita. Buatkan ramalan zodiak harian yang singkat, lucu, dan menghibur untuk orang tua yang membaca.

Nama anak: ${child.name}
Zodiak: ${zodiac_sign || "?"}
Shio: ${shio || "?"}
Elemen: ${element || "?"}
Mood hari ini: ${mood || "Ceria"}
Aktivitas hari ini: ${eventSummary}

Tulis dalam Bahasa Indonesia, maks 4-5 kalimat pendek. Gaya bahasa: lucu, hangat, penuh emoji, seperti ramalan di majalah tapi versi bayi. Jangan terlalu serius. Jadikan aktivitas hari ini bagian dari "ramalan". Mulai dengan emoji zodiak lalu langsung cerita.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Terlalu banyak permintaan, coba lagi nanti." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI error:", aiResponse.status, t);
      throw new Error("AI gateway error");
    }

    const result = await aiResponse.json();
    const content = result.choices?.[0]?.message?.content || "Bintang-bintang sedang istirahat ✨";

    return new Response(JSON.stringify({ horoscope: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("horoscope error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
