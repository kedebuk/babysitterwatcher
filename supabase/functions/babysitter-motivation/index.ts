import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { child_id, date, babysitter_name } = await req.json();
    if (!child_id) throw new Error("child_id is required");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Verify access to child
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("name, dob")
      .eq("id", child_id)
      .single();
    if (childError || !child) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const logDate = date || new Date().toISOString().split("T")[0];

    // Fetch today's events
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

    const firstName = (babysitter_name || "Kak").split(" ")[0];

    const eventSummary = events.length > 0
      ? events
          .map(
            (e: any) =>
              `${e.time?.substring(0, 5)} ${e.type}${e.amount ? ` ${e.amount}${e.unit || ""}` : ""}${e.detail ? ` (${e.detail})` : ""}`
          )
          .join(", ")
      : "";

    const hasEvents = events.length > 0;

    const prompt = hasEvents
      ? `Kamu adalah asisten yang hangat dan penuh semangat. Buatkan pesan motivasi singkat dalam Bahasa Indonesia untuk pengasuh anak bernama "${firstName}".

Nama anak yang diasuh: ${child.name}
Aktivitas hari ini yang sudah dilakukan pengasuh: ${eventSummary}

Buatkan pesan motivasi 2-3 kalimat yang:
1. Menyapa pengasuh dengan namanya ("Kak ${firstName}")
2. Mengapresiasi apa yang sudah dilakukan hari ini (sebutkan secara spesifik berdasarkan data aktivitas)
3. Diakhiri dengan kalimat penyemangat atau kata mutiara tentang merawat anak
4. Gunakan emoji yang sesuai (2-3 emoji saja)
5. Nada hangat, tulus, dan menyemangati

Langsung tulis pesannya tanpa pembuka atau penutup tambahan.`
      : `Kamu adalah asisten yang hangat dan penuh semangat. Buatkan pesan motivasi pagi dalam Bahasa Indonesia untuk pengasuh anak bernama "${firstName}".

Nama anak yang diasuh: ${child.name}

Buatkan pesan motivasi pagi 2-3 kalimat yang:
1. Menyapa pengasuh dengan namanya ("Kak ${firstName}")
2. Memberi semangat untuk hari ini dalam merawat ${child.name}
3. Diakhiri dengan kata mutiara atau pepatah tentang kasih sayang dalam merawat anak
4. Gunakan emoji yang sesuai (2-3 emoji saja)
5. Nada hangat, tulus, dan menyemangati

Langsung tulis pesannya tanpa pembuka atau penutup tambahan.`;

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Terlalu banyak permintaan, coba lagi nanti." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await aiResponse.text();
      console.error("AI error:", aiResponse.status, t);
      throw new Error("AI gateway error");
    }

    const result = await aiResponse.json();
    const content = result.choices?.[0]?.message?.content || `Kak ${firstName}, semangat terus ya merawat ${child.name} hari ini! Setiap usahamu sangat berarti. ✨`;

    return new Response(JSON.stringify({ motivation: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("motivation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
