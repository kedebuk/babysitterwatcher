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
      return new Response(JSON.stringify({ revised: detail || "", corrected_unit: unit || null, corrected_amount: amount || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const foodTypes = ["mpasi", "snack", "buah"];
    const isFood = foodTypes.includes(type);

    const prompt = `Kamu adalah asisten pencatat aktivitas bayi/balita. Lakukan 2 tugas:

1. Perbaiki teks catatan agar lebih rapi dan enak dibaca. Tetap singkat (1-2 kalimat). Bahasa Indonesia.
2. ${isFood ? `ESTIMASI BERAT MAKANAN dalam gram dari deskripsi. Contoh:
   - "Nasi 130ml habis + dori panggang kecap habis + telur habis" → sekitar 200-250 gram total
   - "Bola bola ubi ungu 3pcs" → sekitar 90 gram (30g per pcs)
   - "Bubur ayam 1 mangkok kecil" → sekitar 150 gram
   - "Pisang 1 buah" → sekitar 80 gram
   Jika ada angka ml untuk makanan, konversi ke gram (1ml ≈ 1g untuk makanan). Hitung TOTAL semua item.
   Jika user sudah input jumlah yang masuk akal (>50g untuk makanan utama), gunakan itu.
   Jumlah user saat ini: ${amount || 'tidak ada'}${unit || ''}` : 'Tidak perlu estimasi berat.'}

Tipe: ${type || "catatan"}
Catatan: "${detail}"

Balas HANYA JSON (tanpa markdown):
{"revised": "teks rapi", "corrected_amount": ${isFood ? 'angka_gram_estimasi' : 'null'}, "corrected_unit": ${isFood ? '"gram"' : 'null'}}`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-4b:free",
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
    let content = result.choices?.[0]?.message?.content?.trim() || "";

    try {
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify({
        revised: parsed.revised || detail,
        corrected_unit: parsed.corrected_unit || null,
        corrected_amount: parsed.corrected_amount != null ? Number(parsed.corrected_amount) : null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ revised: content || detail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("revise error:", e);
    return new Response(JSON.stringify({ revised: "" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
