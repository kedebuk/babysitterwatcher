import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { detail, type, amount, unit } = await req.json();
    if (!detail || detail.trim().length < 3) {
      return new Response(JSON.stringify({ revised: detail || "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const prompt = `Kamu adalah asisten pencatat aktivitas bayi/balita. Perbaiki dan percantik teks catatan berikut agar lebih rapi, jelas, dan enak dibaca oleh orang tua. Tetap singkat (1-2 kalimat). Gunakan Bahasa Indonesia. Jangan ubah fakta, hanya perbaiki penulisan.

Tipe aktivitas: ${type || "catatan"}
${amount ? `Jumlah: ${amount}${unit || ''}` : ''}
Catatan asli: "${detail}"

Tulis langsung hasil revisinya saja, tanpa penjelasan tambahan.`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      return new Response(JSON.stringify({ revised: detail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await aiResponse.json();
    const revised = result.choices?.[0]?.message?.content?.trim() || detail;

    return new Response(JSON.stringify({ revised }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("revise error:", e);
    return new Response(JSON.stringify({ revised: "" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
