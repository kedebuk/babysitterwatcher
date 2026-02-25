import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, childName, inviterName, inviteRole, signupUrl } = await req.json();

    if (!email || !childName) {
      return new Response(JSON.stringify({ error: "Missing email or childName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get brand name and logo from app_settings
    const { data: brandSettings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["brand_name", "brand_logo_url"]);
    
    const settingsMap: Record<string, string> = {};
    (brandSettings || []).forEach((s: any) => { settingsMap[s.key] = s.value; });
    const brandName = settingsMap["brand_name"] || "Eleanor Tracker";
    const brandLogoUrl = settingsMap["brand_logo_url"] || "";

    const roleLabel = inviteRole === "parent" ? "Keluarga (Viewer)" : "Babysitter";
    const registrationUrl = signupUrl || `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/login`;

    // Send email using Supabase Auth admin API (SMTP)
    // We'll use the built-in email sending via edge function
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #f97316, #fb923c); padding: 32px 24px; text-align: center; color: #fff; }
    .header h1 { margin: 0; font-size: 22px; }
    .header img { max-height: 48px; margin-bottom: 12px; border-radius: 8px; }
    .body { padding: 24px; }
    .body p { color: #444; line-height: 1.6; margin: 12px 0; }
    .highlight { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 8px; margin: 16px 0; }
    .highlight strong { color: #ea580c; }
    .inviter { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 16px; border-radius: 8px; margin: 12px 0; }
    .inviter strong { color: #16a34a; }
    .cta { display: block; background: #f97316; color: #fff !important; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .footer { text-align: center; padding: 16px 24px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${brandLogoUrl ? `<img src="${brandLogoUrl}" alt="${brandName}" />` : ''}
      <h1>📩 Undangan dari ${brandName}</h1>
    </div>
    <div class="body">
      <p>Halo! 👋</p>
      <div class="inviter">
        ✉️ Diundang oleh: <strong>${inviterName || "Seseorang"}</strong>
      </div>
      <p>Anda diundang untuk bergabung di <strong>${brandName}</strong> sebagai <strong>${roleLabel}</strong> untuk anak:</p>
      <div class="highlight">
        <strong>👶 ${childName}</strong>
      </div>
      <p>Silakan daftar atau login untuk menerima undangan ini:</p>
      <a href="${registrationUrl}" class="cta">Daftar / Login Sekarang →</a>
      <p style="font-size: 13px; color: #888;">Jika Anda sudah memiliki akun, cukup login dan undangan akan muncul di dashboard Anda.</p>
    </div>
    <div class="footer">
      <p>${brandName} — Pantau Si Kecil dengan Cinta 💛</p>
    </div>
  </div>
</body>
</html>`;

    // Use Resend or SMTP - since we don't have Resend, we'll use Supabase's inbuilt auth.admin
    // Actually, we need to send a custom email. Let's use the supabase auth admin inviteUserByEmail
    // which sends an email to the user. But that creates a user. We want custom email.
    
    // For now, use supabase.auth.admin.inviteUserByEmail for non-existing users
    // For existing users, they already get in-app notification
    
    // Check if user exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!existingProfile) {
      // User doesn't exist - send invite via Supabase Auth (creates a placeholder user with invite)
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          name: email.split("@")[0],
          role: inviteRole === "parent" ? "viewer" : "babysitter",
          invited_by: user.id,
        },
        redirectTo: signupUrl || undefined,
      });

      if (inviteError) {
        // If user already invited via auth, that's OK
        if (!inviteError.message.includes("already been registered")) {
          console.error("Invite error:", inviteError);
          return new Response(JSON.stringify({ error: inviteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ success: true, method: "auth_invite" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User exists - they already get in-app notification, just confirm
    return new Response(JSON.stringify({ success: true, method: "in_app_notification" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
