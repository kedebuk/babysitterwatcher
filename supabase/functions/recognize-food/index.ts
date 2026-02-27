import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const authHeader = req.headers.get("authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { image_base64, parent_id } = await req.json();
    if (!image_base64) throw new Error("No image provided");

    const targetParentId = parent_id || user.id;

    // Fetch existing food memory for context
    const { data: memories } = await supabase
      .from("food_memory")
      .select("food_name, description, avg_weight_gram, usage_count")
      .eq("parent_id", targetParentId)
      .order("usage_count", { ascending: false })
      .limit(30);

    const memoryContext = memories && memories.length > 0
      ? `Makanan yang sudah dikenal sebelumnya:\n${memories.map(m => `- ${m.food_name}: ${m.description || ''} (~${m.avg_weight_gram}g, digunakan ${m.usage_count}x)`).join('\n')}`
      : "Belum ada memori makanan.";

    const prompt = `Kamu adalah asisten pengenalan makanan bayi/balita. Analisis foto ini dan identifikasi makanan yang ada.

${memoryContext}

Tugas:
1. Identifikasi semua makanan yang terlihat di foto
2. Estimasi berat total dalam gram
3. Berikan confidence level (high/medium/low)
4. Jika ada makanan yang mirip dengan memori, gunakan nama yang sama

Balas HANYA JSON (tanpa markdown):
{
  "foods": [{"name": "nama makanan", "estimated_gram": angka}],
  "total_gram": angka_total,
  "description": "deskripsi singkat semua makanan dalam 1 kalimat",
  "confidence": "high/medium/low",
  "question": "pertanyaan klarifikasi jika confidence rendah, null jika yakin"
}`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image_base64 } },
          ],
        }],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, coba lagi nanti." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credit habis, silakan top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error: " + aiResponse.status);
    }

    const result = await aiResponse.json();
    let content = result.choices?.[0]?.message?.content?.trim() || "";

    try {
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(content);

      // Save/update food memory for each recognized food
      if (parsed.foods && parsed.confidence !== "low") {
        for (const food of parsed.foods) {
          const { data: existing } = await supabase
            .from("food_memory")
            .select("id, usage_count, avg_weight_gram")
            .eq("parent_id", targetParentId)
            .eq("food_name", food.name)
            .maybeSingle();

          if (existing) {
            // Update: rolling average weight + increment count
            const newCount = existing.usage_count + 1;
            const newAvg = Math.round(((existing.avg_weight_gram || 0) * existing.usage_count + food.estimated_gram) / newCount);
            await supabase
              .from("food_memory")
              .update({ usage_count: newCount, avg_weight_gram: newAvg })
              .eq("id", existing.id);
          } else {
            await supabase
              .from("food_memory")
              .insert({
                parent_id: targetParentId,
                food_name: food.name,
                avg_weight_gram: food.estimated_gram,
                description: parsed.description,
              });
          }
        }
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ 
        description: content, 
        total_gram: null, 
        confidence: "low",
        question: "Tidak bisa mengidentifikasi makanan dari foto. Coba foto ulang dengan lebih jelas.",
        foods: [] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("recognize-food error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
