import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { child_id } = await req.json();
    if (!child_id) throw new Error("child_id is required");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Verify user has access to this child (RLS enforced)
    const { data: child, error: childError } = await supabase.from("children").select("name, dob").eq("id", child_id).single();
    if (childError || !child) {
      return new Response(JSON.stringify({ error: "Not authorized to access this child" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get last 14 days of logs + events
    const today = new Date();
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    const fromDate = twoWeeksAgo.toISOString().split("T")[0];

    const { data: logs } = await supabase
      .from("daily_logs")
      .select("id, log_date, notes")
      .eq("child_id", child_id)
      .gte("log_date", fromDate)
      .order("log_date");

    let allEvents: any[] = [];
    if (logs && logs.length > 0) {
      const logIds = logs.map((l: any) => l.id);
      const { data: events } = await supabase
        .from("events")
        .select("daily_log_id, time, type, detail, amount, unit, status")
        .in("daily_log_id", logIds)
        .order("time");
      allEvents = events || [];
    }

    // Build summary for AI
    const logSummaries = (logs || []).map((log: any) => {
      const dayEvents = allEvents.filter((e: any) => e.daily_log_id === log.id);
      return {
        date: log.log_date,
        notes: log.notes,
        events: dayEvents.map((e: any) => `${e.time?.substring(0, 5)} ${e.type}${e.amount ? ` ${e.amount}${e.unit || ''}` : ''}${e.detail ? ` (${e.detail})` : ''}`),
      };
    });

    const prompt = `Kamu adalah asisten analisis perkembangan anak. Analisis data aktivitas harian anak berikut dan berikan insight dalam Bahasa Indonesia.

Nama anak: ${child?.name || "Anak"}
${child?.dob ? `Tanggal lahir: ${child.dob}` : ""}

Data aktivitas 14 hari terakhir:
${JSON.stringify(logSummaries, null, 1)}

Berikan analisis singkat (maks 300 kata) meliputi:
1. **Pola Tidur**: Apakah tidur teratur? Rata-rata durasi?
2. **Pola Makan**: Frekuensi susu/MPASI, total asupan susu harian.
3. **Pola BAB/BAK**: Frekuensi normal atau tidak?
4. **Saran**: Rekomendasi praktis untuk orang tua.

Gunakan emoji untuk mempercantik. Jangan berikan disclaimer medis berlebihan.`;

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
    const content = result.choices?.[0]?.message?.content || "Tidak ada insight.";

    return new Response(JSON.stringify({ insight: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("insight error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
