import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState, useCallback } from "react";

/* ── Intersection Observer hook for scroll-triggered animations ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("lp-visible"); observer.unobserve(el); } },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Animated counter hook ── */
function useCounter(end: number, suffix: string, duration = 1600) {
  const [display, setDisplay] = useState("0" + suffix);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
          const val = Math.round(ease * end);
          setDisplay(val.toLocaleString("id-ID") + suffix);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.unobserve(el);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, suffix, duration]);
  return { ref, display };
}

export default function LandingPage() {
  const { user, loading, activeRole } = useAuth();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    if (user) {
      // Already logged in — redirect to dashboard
      if (!user.phoneComplete) { navigate("/complete-phone"); return; }
      if (!user.role) { navigate("/select-role"); return; }
      const roles = user.roles || [];
      if (roles.length > 1 && !activeRole) { navigate("/choose-role"); return; }
      const effectiveRole = roles.length > 1 ? activeRole : user.role;
      const redirectMap: Record<string, string> = { parent: '/parent/dashboard', babysitter: '/babysitter/today', admin: '/admin/dashboard', viewer: '/viewer/dashboard' };
      navigate(redirectMap[effectiveRole || user.role!]);
    } else {
      navigate("/login");
    }
  };

  // Scroll reveal refs for each section
  const empathyRef = useScrollReveal();
  const transformRef = useScrollReveal();
  const calcRef = useScrollReveal();
  const roleRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const mockupRef = useScrollReveal();
  const testiRef = useScrollReveal();
  const pricingRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const finalRef = useScrollReveal();

  // Animated counters
  const stat1 = useCounter(500, "+");
  const stat2 = useCounter(10, "K+", 1200);
  const stat3 = useCounter(4.9, "★", 1400);

  // For stat3, we need decimal
  const stat3dec = useRef<HTMLDivElement>(null);
  const [stat3display, setStat3display] = useState("0★");
  const stat3started = useRef(false);
  useEffect(() => {
    const el = stat3dec.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !stat3started.current) {
        stat3started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / 1400, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          const val = (ease * 4.9).toFixed(1);
          setStat3display(val + "★");
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.unobserve(el);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{landingStyles}</style>
      <div className="lp-root">
        {/* STICKY NAV */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <div className="lp-logo">
              <span className="lp-logo-icon">👶</span>
              <span className="lp-logo-text">Baby Watcher</span>
            </div>
            <button className="lp-nav-btn" onClick={handleAuthClick} disabled={loading}>
              {loading ? "..." : user ? "Ke Dashboard →" : "Masuk / Daftar"}
            </button>
          </div>
        </nav>

        {/* HERO */}
        <div className="lp-hero">
          <div className="lp-hero-badge"><span className="lp-pulse" /> Coba 7 Hari Gratis — Tanpa Kartu Kredit</div>
          <h1 className="lp-hero-h1">Kerja Tenang,<br/>Si Kecil <em>Terpantau</em><br/>Real-Time</h1>
          <p className="lp-hero-p">Babysitter catat. Kamu pantau dari HP.<br/>Susu, makan, tidur, foto, lokasi — semua ada.</p>
          {/* Phone Mockup — floating animation */}
          <div className="lp-phone-wrapper">
            <div className="lp-phone lp-float">
              <div className="lp-phone-notch" />
              <div className="lp-phone-inner">
                <div className="lp-app-status"><span>9:41</span><span>⚡ 87%</span></div>
                <div className="lp-app-header">
                  <div>
                    <div className="lp-app-greeting">Selamat pagi 👋</div>
                    <div className="lp-app-name">Dashboard Eleanor</div>
                  </div>
                  <div className="lp-app-avatar">M</div>
                </div>
                <div className="lp-app-date">📅 Selasa, 11 Mar 2026</div>
                <div className="lp-app-grid">
                  <div className="lp-app-card lp-alert">
                    <div className="lp-sc-top"><span>🍼</span><span className="lp-sc-label">Susu</span></div>
                    <div className="lp-sc-value lp-text-alert">90 ml</div>
                    <div className="lp-sc-sub">sisa 30ml ⚠️</div>
                  </div>
                  <div className="lp-app-card">
                    <div className="lp-sc-top"><span>🍽️</span><span className="lp-sc-label">Makan</span></div>
                    <div className="lp-sc-value">280 g</div>
                    <div className="lp-sc-sub">3x makan hari ini</div>
                  </div>
                  <div className="lp-app-card">
                    <div className="lp-sc-top"><span>😴</span><span className="lp-sc-label">Tidur</span></div>
                    <div className="lp-sc-value lp-text-good">2j 15m</div>
                    <div className="lp-sc-sub">siang 1j30m</div>
                  </div>
                  <div className="lp-app-card">
                    <div className="lp-sc-top"><span>💩</span><span className="lp-sc-label">BAB/BAK</span></div>
                    <div className="lp-sc-value">2 / 5</div>
                    <div className="lp-sc-sub">normal ✓</div>
                  </div>
                </div>
                {[
                  { icon: "🍼", bg: "#FFF3E0", title: "Susu 60ml — sisa 30ml", detail: "ASI Perah · Botol Dr.Brown", time: "09:15" },
                  { icon: "🥣", bg: "#E8F5E9", title: "MPASI Bubur Ayam", detail: "120g · habis · 📸", time: "08:30" },
                  { icon: "😴", bg: "#E3F2FD", title: "Tidur Siang", detail: "durasi 1j 30m", time: "12:00" },
                ].map((ev, i) => (
                  <div className="lp-event-row" key={i}>
                    <div className="lp-ev-icon" style={{ background: ev.bg }}>{ev.icon}</div>
                    <div className="lp-ev-info">
                      <div className="lp-ev-title">{ev.title}</div>
                      <div className="lp-ev-detail">{ev.detail}</div>
                    </div>
                    <div className="lp-ev-time">{ev.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TRUST BAR */}
        <div className="lp-trust">
          <div className="lp-trust-item"><span>🔒</span> Data Privat</div>
          <div className="lp-trust-item"><span>⚡</span> Real-Time</div>
          <div className="lp-trust-item"><span>📱</span> Tanpa Install</div>
        </div>

        {/* STATS — animated counters */}
        <div className="lp-stats">
          <div className="lp-stat"><div className="lp-stat-num" ref={stat1.ref}>{stat1.display}</div><div className="lp-stat-label">Keluarga</div></div>
          <div className="lp-stat"><div className="lp-stat-num" ref={stat2.ref}>{stat2.display}</div><div className="lp-stat-label">Log / Hari</div></div>
          <div className="lp-stat"><div className="lp-stat-num" ref={stat3dec}>{stat3display}</div><div className="lp-stat-label">Rating</div></div>
        </div>

        {/* EMPATHY / PAIN */}
        <div className="lp-section lp-empathy lp-reveal" ref={empathyRef}>
          <div className="lp-tag">Kamu Pasti Ngerasain Ini</div>
          <div className="lp-empathy-quote">"Lagi meeting, tapi pikiran di rumah. Bayi udah makan belum ya?"</div>
          <div className="lp-pain-cards">
            {[
              { icon: "📱", title: "WA babysitter 5-10x sehari", desc: '"Udah minum susu?", "Udah makan?", "Lagi tidur?" — repeat terus, chat tenggelam.' },
              { icon: "😰", title: "Nggak ada data yang jelas", desc: 'Babysitter bilang "udah minum kok." Tapi berapa ml? Habis atau ada sisa? Nggak dicatat.' },
              { icon: "😴", title: "Pola bayi nggak terpantau", desc: 'Tidur jam berapa? Bangun kapan? BAB berapa kali? Pas ke dokter, jawabannya "kayaknya..."' },
              { icon: "📍", title: "Nggak tau babysitter di mana", desc: "Bawa bayi jalan ke taman? Ke mall? Nggak ada cara tau tanpa nanya terus-terusan." },
            ].map((p, i) => (
              <div className="lp-pain-card" key={i}>
                <span className="lp-pc-icon">{p.icon}</span>
                <div>
                  <div className="lp-pc-title">{p.title}</div>
                  <div className="lp-pc-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BEFORE / AFTER */}
        <div className="lp-transform lp-reveal" ref={transformRef}>
          <div className="lp-tag" style={{ color: "#FFAB76" }}>Bedanya Nyata</div>
          <h2 className="lp-h2" style={{ color: "#fff" }}>Tanpa vs Dengan Baby Watcher</h2>
          <div className="lp-ba-grid">
            <div className="lp-ba-col lp-before">
              <div className="lp-ba-label" style={{ color: "#EF5350" }}>❌ Tanpa</div>
              {["WA bolak-balik", "Nggak ada catatan", "Cemas saat kerja", "Lokasi nggak tau", "Ke dokter tanpa data"].map((t, i) => (
                <div className="lp-ba-item" key={i}><span style={{ color: "#EF5350" }}>✕</span> {t}</div>
              ))}
            </div>
            <div className="lp-ba-col lp-after">
              <div className="lp-ba-label" style={{ color: "#66BB6A" }}>✅ Dengan</div>
              {["Dashboard real-time", "Data ml-level presisi", "Kerja tenang, fokus", "GPS otomatis", "Riwayat lengkap"].map((t, i) => (
                <div className="lp-ba-item" key={i}><span style={{ color: "#66BB6A" }}>✓</span> {t}</div>
              ))}
            </div>
          </div>
          <div className="lp-transform-result">
            <div className="lp-tr-big">😌 → 100% Tenang</div>
            <div className="lp-tr-sub">Babysitter input, kamu pantau.<br/>Tanpa ganggu meeting. Tanpa cemas.</div>
          </div>
        </div>

        {/* VALUE CALC */}
        <div className="lp-section lp-calc-section lp-reveal" ref={calcRef}>
          <div className="lp-tag">Hitung Sendiri</div>
          <h2 className="lp-h2">Berapa "harga" ketenangan pikiran kamu?</h2>
          <div className="lp-calc-card">
            {[
              { label: "Tanpa App — WA Babysitter", value: "5-10x/hari", detail: "Bolak-balik nanya hal yang sama, setiap hari, setiap minggu. Chat nggak ada datanya." },
              { label: "Waktu Kerja Terganggu", value: "~30 menit/hari", detail: "Cek HP, reply WA, mikirin bayi di tengah kerjaan. Fokus buyar, produktivitas turun." },
              { label: "Level Cemas", value: "😰 Tinggi", detail: "Nggak ada catatan. Nggak tau bayi terakhir makan kapan. Andalkan ingatan babysitter aja." },
            ].map((s, i) => (
              <div className="lp-calc-step" key={i}>
                <div className="lp-calc-num">{i + 1}</div>
                <div className="lp-calc-text">
                  <div className="lp-calc-label">{s.label}</div>
                  <div className="lp-calc-value">{s.value}</div>
                  <div className="lp-calc-detail">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-calc-result">
            <div className="lp-cr-label">Dengan Baby Watcher</div>
            <div className="lp-cr-num">😌 Tenang 100%</div>
            <div className="lp-cr-note">Semua tercatat otomatis. Real-time. Presisi.<br/>Coba 7 hari gratis — mulai dari Rp69rb/bulan.</div>
          </div>
        </div>

        {/* ROLES */}
        <div className="lp-section lp-role-section lp-reveal" ref={roleRef}>
          <div className="lp-tag">Siapa Pakai Apa</div>
          <h2 className="lp-h2">3 role, 1 tujuan — bayi terjaga dengan baik</h2>
          <div className="lp-role-grid">
            {[
              { icon: "👩‍💼", bg: "#FFF0E6", name: "Parent", desc: "Pantau dashboard real-time. Lihat semua aktivitas, foto, dan lokasi. Terima notifikasi otomatis." },
              { icon: "👩‍🍼", bg: "#E8F5E9", name: "Babysitter", desc: "Input aktivitas harian — susu, makan, tidur, BAB, foto. Tap-tap, selesai. Simpel dari HP." },
              { icon: "👴", bg: "#E3F2FD", name: "Viewer", desc: "Nenek, kakek, keluarga. Dashboard read-only — ikut pantau tanpa ribet." },
            ].map((r, i) => (
              <div className="lp-role-card" key={i}>
                <div className="lp-role-icon" style={{ background: r.bg }}>{r.icon}</div>
                <div>
                  <div className="lp-role-name">{r.name}</div>
                  <div className="lp-role-desc">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <div className="lp-section lp-features-section lp-reveal" ref={featuresRef}>
          <div className="lp-tag">Fitur Lengkap</div>
          <h2 className="lp-h2">Semua yang kamu butuhkan, ada di sini</h2>
          <div className="lp-features-grid">
            {[
              { emoji: "🍼", bg: "#FFF3E0", title: "Tracking Susu ml-Level", desc: "Catat jumlah disiapkan, diminum, dan sisa. Total harian, trend mingguan. Babysitter pilih \"Habis\" atau \"Sisa\" — sisanya dihitung otomatis.", peek: "⚡ Alert kalau intake di bawah target", highlight: true },
              { emoji: "🥣", bg: "#E8F5E9", title: "Makan & Nutrisi", desc: "MPASI, snack, buah, vitamin — semua tercatat. Jenis, gram, waktu. Foto makanan bisa di-attach langsung dari kamera.", peek: "📸 Lihat foto makanan si kecil real-time" },
              { emoji: "😴", bg: "#E3F2FD", title: "Pola Tidur Otomatis", desc: "Babysitter tap \"Tidur\" dan \"Bangun\" — durasi dihitung otomatis. Total siang vs malam. Berguna buat laporan ke dokter anak.", peek: "📊 Grafik tidur mingguan" },
              { emoji: "📍", bg: "#FCE4EC", title: "Lokasi & Foto Real-Time", desc: "Setiap input aktivitas, lokasi babysitter otomatis tercatat via GPS. Plus foto — lihat si kecil langsung dari kantor.", peek: "🗺️ Klik \"Lihat Lokasi\" di setiap event", highlight: true },
              { emoji: "📊", bg: "#F3E5F5", title: "Riwayat & Insight", desc: "Scroll ke tanggal mana pun — data tetap ada. Trend mingguan dalam grafik visual. Export ringkasan via WhatsApp.", peek: "📤 1-tap kirim ringkasan ke dokter" },
              { emoji: "👥", bg: "#E0F2F1", title: "Multi-Role & Multi-Anak", desc: "Ajak nenek/kakek sebagai viewer. Tambah lebih dari satu anak — masing-masing punya dashboard terpisah.", peek: "👨‍👩‍👧‍👦 Kolaborasi satu keluarga" },
            ].map((f, i) => (
              <div className={`lp-feature-card ${f.highlight ? "lp-feature-hl" : ""}`} key={i}>
                <div className="lp-feature-top">
                  <div className="lp-feature-emoji" style={{ background: f.bg }}>{f.emoji}</div>
                  <div className="lp-feature-title">{f.title}</div>
                </div>
                <div className="lp-feature-desc">{f.desc}</div>
                <div className="lp-feature-peek">{f.peek}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BABYSITTER MOCKUP */}
        <div className="lp-section lp-mockup-section lp-reveal" ref={mockupRef}>
          <div className="lp-tag" style={{ textAlign: "center" }}>Babysitter View</div>
          <h2 className="lp-h2" style={{ textAlign: "center" }}>Ini yang babysitter lihat — simpel banget 📱</h2>
          <p style={{ textAlign: "center", fontSize: 14, color: "#888", marginTop: -10, marginBottom: 10 }}>Bahkan yang gaptek pun bisa pakai dalam 2 menit.</p>
          <div className="lp-phone-mockup-sm lp-float">
            <div className="lp-pm-screen">
              <div className="lp-pm-header"><span style={{ color: "#FF7043" }}>←</span><span style={{ fontWeight: 800, flex: 1 }}>Input Hari Ini</span><span style={{ color: "#aaa", fontSize: 10 }}>11 Mar</span></div>
              {[
                { icon: "🍼", bg: "#FFF3E0", title: "Susu 90ml — sisa 30ml", sub: "ASI Perah · Dr.Brown", right: "09:15" },
                { icon: "🥣", bg: "#E8F5E9", title: "MPASI Bubur Ayam 120g", sub: "Habis · Menu siang", right: "📸" },
                { icon: "😴", bg: "#E3F2FD", title: "Tidur Siang 1j30m", sub: "12:00 — 13:30", right: "13:30" },
                { icon: "💩", bg: "#FFF9C4", title: "BAB — Normal", sub: "Warna & tekstur OK", right: "14:15" },
                { icon: "💊", bg: "#FCE4EC", title: "Vitamin D3 ✓", sub: "Dosis pagi", right: "08:00" },
              ].map((l, i) => (
                <div className="lp-pm-log" key={i}>
                  <div className="lp-pm-icon" style={{ background: l.bg }}>{l.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#333" }}>{l.title}</div>
                    <div style={{ fontSize: 9, color: "#aaa" }}>{l.sub}</div>
                  </div>
                  <div style={{ fontSize: 9, color: "#ccc", fontWeight: 600 }}>{l.right}</div>
                </div>
              ))}
              <div className="lp-pm-add">+ Tambah Aktivitas Baru</div>
            </div>
          </div>
        </div>

        {/* TESTIMONIALS */}
        <div className="lp-section lp-testi-section lp-reveal" ref={testiRef}>
          <div className="lp-tag">Cerita Nyata</div>
          <h2 className="lp-h2">Mereka sudah merasakan bedanya</h2>
          <p className="lp-testi-intro">Dari working mama di kota besar sampai papa yang dinas luar kota — inilah pengalaman mereka setelah pakai Baby Watcher.</p>
          <div className="lp-testi-grid">
            {[
              { stars: 5, metric: "📉 Frekuensi WA babysitter turun 90%", quote: "Baru seminggu, udah kerasa banget bedanya. Sekarang meeting nggak sambil cek WA tiap 10 menit. Buka app, langsung keliatan semua — susu berapa, udah makan belum, tidur berapa lama.", bold: "Baru seminggu, udah kerasa banget bedanya.", name: "Mama Alya", role: "Product Manager — Bandung", badge: "3 bulan", bg: "#FFF0E6", avatar: "👩", highlight: true },
              { stars: 5, quote: "Fitur lokasi game changer. Sekarang tau babysitter bawa anak ke taman atau di rumah aja — tanpa nanya. Plus pas kontrol ke dokter anak, tinggal buka riwayat.", bold: "Fitur lokasi game changer.", name: "Papa Rafi", role: "Software Engineer — Jakarta", badge: "2 bulan", bg: "#E3F2FD", avatar: "👨" },
              { stars: 5, quote: "Babysitter saya yang gaptek aja bisa langsung pakai. Tinggal tap-tap, foto, selesai. Dan nenek juga saya kasih akses viewer — sekarang nggak nelpon tiap jam nanya \"cucunya udah makan?\" 😂", bold: "Babysitter saya yang gaptek aja bisa langsung pakai.", name: "Mama Keisha", role: "Dokter Gigi — Surabaya", badge: "4 bulan", bg: "#E8F5E9", avatar: "👩" },
              { stars: 5, quote: "Saya sering dinas luar kota. Dulu was-was banget ninggalin anak sama babysitter. Sekarang tinggal buka app — foto aktivitas masuk, lokasi keliatan, susu dan makan tercatat rapi.", bold: "Saya sering dinas luar kota.", name: "Papa Dimas", role: "Sales Manager — Semarang", badge: "1 bulan", bg: "#FFF8E1", avatar: "👨" },
            ].map((t, i) => (
              <div className={`lp-testi-card ${t.highlight ? "lp-testi-hl" : ""}`} key={i}>
                <div className="lp-testi-stars">{"★".repeat(t.stars)}</div>
                {t.metric && <div className="lp-testi-metric">{t.metric}</div>}
                <div className="lp-testi-quote">
                  <strong>{t.bold}</strong> {t.quote.replace(t.bold, "")}
                </div>
                <div className="lp-testi-author">
                  <div className="lp-testi-avatar" style={{ background: t.bg }}>{t.avatar}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role-text">{t.role}</div>
                    <div className="lp-testi-badge">✓ Pengguna aktif {t.badge}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING */}
        <div className="lp-price-section lp-reveal" id="order" ref={pricingRef}>
          <p className="lp-price-tag">Pilih Paket</p>
          <h2 className="lp-price-h2">Ketenangan pikiran<br/>nggak harus mahal.</h2>
          <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 24, color: "#fff" }}>Semua paket bisa dicoba 7 hari gratis.</p>

          {/* TRIAL BANNER */}
          <div className="lp-trial-banner">
            <div className="lp-trial-icon">🎁</div>
            <div>
              <div className="lp-trial-title">7 Hari Gratis — Semua Fitur</div>
              <div className="lp-trial-desc">Tanpa kartu kredit. Langsung pakai. Batalkan kapan saja.</div>
            </div>
          </div>

          {/* STARTER */}
          <div className="lp-price-box">
            <div className="lp-price-ribbon">Populer</div>
            <div className="lp-plan-name">Starter</div>
            <div className="lp-plan-for">1 anak</div>
            <div className="lp-price-amount"><span className="lp-price-rp">Rp</span>69<span className="lp-price-rb">rb</span></div>
            <div className="lp-price-period">/ bulan</div>
            <ul className="lp-bonus-list">
              {["Dashboard real-time parent", "Input babysitter unlimited", "Tracking susu, makan, tidur, BAB", "Foto aktivitas bayi", "Lokasi babysitter otomatis (GPS)", "3 role (Parent, Babysitter, Viewer)", "Riwayat harian & trend mingguan", "Export ringkasan via WhatsApp"].map((b, i) => (
                <li key={i}><span className="lp-check">✓</span> {b}</li>
              ))}
            </ul>
            <button className="lp-btn-orange-block" onClick={handleAuthClick}>
              {user ? "Buka Dashboard →" : "Coba 7 Hari Gratis →"}
            </button>
          </div>

          {/* PREMIUM */}
          <div className="lp-price-box lp-price-premium">
            <div className="lp-price-ribbon lp-ribbon-premium">Best Value</div>
            <div className="lp-plan-name">Premium</div>
            <div className="lp-plan-for">sampai 4 anak</div>
            <div className="lp-price-amount"><span className="lp-price-rp">Rp</span>169<span className="lp-price-rb">rb</span></div>
            <div className="lp-price-period">/ bulan</div>
            <div className="lp-price-save-tag">Hemat 39% vs 4x Starter</div>
            <ul className="lp-bonus-list">
              {["Semua fitur Starter", "Sampai 4 anak — dashboard terpisah", "Unlimited babysitter & viewer", "Insight & grafik perbandingan anak", "Prioritas support", "Fitur baru lebih dulu"].map((b, i) => (
                <li key={i}><span className="lp-check lp-check-gold">✓</span> {b}</li>
              ))}
            </ul>
            <button className="lp-btn-orange-block" onClick={handleAuthClick}>
              {user ? "Buka Dashboard →" : "Coba 7 Hari Gratis →"}
            </button>
          </div>

          <p className="lp-price-guarantee">🔒 <strong>Data 100% privat.</strong> Dilindungi enkripsi dan Row Level Security — standar keamanan enterprise.</p>
        </div>

        {/* FAQ */}
        <div className="lp-section lp-faq-section lp-reveal" ref={faqRef}>
          <div className="lp-tag">Tanya Jawab</div>
          <h2 className="lp-h2">Punya pertanyaan?</h2>
          {[
            { q: "Ini app apa sih sebenarnya?", a: "Baby Watcher App adalah aplikasi monitoring bayi harian. Babysitter mencatat aktivitas si kecil (susu, makan, tidur, dll), dan orang tua bisa memantau semuanya real-time dari HP — tanpa harus WA bolak-balik." },
            { q: "Gimana cara kerja 7 hari gratis?", a: "Langsung daftar, langsung pakai semua fitur tanpa batas selama 7 hari. Tidak perlu kartu kredit. Setelah 7 hari, pilih paket Starter (Rp69rb/bulan) atau Premium (Rp169rb/bulan). Bisa batalkan kapan saja." },
            { q: "Bedanya Starter dan Premium?", a: "Starter untuk 1 anak, cocok untuk keluarga dengan satu bayi. Premium untuk sampai 4 anak dengan dashboard terpisah masing-masing — plus insight perbandingan antar anak dan prioritas support. Hemat 39% dibanding ambil 4x Starter." },
            { q: "Babysitter saya gaptek, bisa pakai?", a: "Sangat bisa! Interface untuk babysitter dirancang sesimpel mungkin — tinggal pilih jenis aktivitas, isi detail, tap simpan. Kalau bisa pakai WhatsApp, pasti bisa pakai app ini." },
            { q: "Data bayi saya aman nggak?", a: "Sangat aman. Kami menggunakan Supabase dengan Row Level Security — artinya hanya kamu dan orang yang kamu undang yang bisa melihat data. Data dienkripsi dan disimpan di server aman." },
            { q: "Harus install app dari Play Store?", a: "Tidak perlu! Baby Watcher adalah web app — langsung buka dari browser HP. Bisa di-bookmark ke home screen supaya terasa seperti app native." },
          ].map((faq, i) => (
            <div className="lp-faq-item" key={i} onClick={(e) => e.currentTarget.classList.toggle("open")}>
              <div className="lp-faq-q"><span>{faq.q}</span><div className="lp-faq-toggle">+</div></div>
              <p className="lp-faq-a">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* FINAL CTA */}
        <div className="lp-final-cta lp-reveal" ref={finalRef}>
          <div className="lp-urgency">🎁 7 hari gratis — mulai sekarang</div>
          <h2 className="lp-h2">Kamu kerja keras untuk keluarga.<br/>Biar app ini yang bantu jaga ketenangan pikiran.</h2>
          <p style={{ fontSize: 14, color: "#777", lineHeight: 1.6, marginBottom: 24 }}>Mulai pantau si kecil dalam 30 detik. 7 hari gratis, tanpa install, langsung pakai.</p>
          <button className="lp-btn-orange" onClick={handleAuthClick}>
            {user ? "Buka Dashboard →" : "Coba 7 Hari Gratis →"}
          </button>
          <span style={{ display: "block", fontSize: 12, color: "#aaa", marginTop: 10 }}>Tanpa kartu kredit. Batalkan kapan saja.</span>
        </div>

        {/* FOOTER */}
        <div className="lp-footer">
          <div className="lp-footer-brand">Baby Watcher App</div>
          <p>Pantau Si Kecil dengan Cinta, Dari Mana Saja</p>
          <p style={{ marginTop: 8 }}>© 2026 Baby Watcher App. Built with ❤️ for Indonesian parents.</p>
        </div>
      </div>
    </>
  );
}

const landingStyles = `
  .lp-root { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #333; max-width: 480px; margin: 0 auto; overflow-x: hidden; -webkit-font-smoothing: antialiased; }

  /* NAV */
  .lp-nav { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.06); }
  .lp-nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; max-width: 480px; margin: 0 auto; }
  .lp-logo { display: flex; align-items: center; gap: 8px; }
  .lp-logo-icon { font-size: 20px; }
  .lp-logo-text { font-size: 15px; font-weight: 800; color: #222; letter-spacing: -0.3px; }
  .lp-nav-btn { background: linear-gradient(135deg, #FF7043, #FF8A65); color: #fff; border: none; font-family: inherit; font-size: 13px; font-weight: 700; padding: 8px 18px; border-radius: 50px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px rgba(255,112,67,0.3); }
  .lp-nav-btn:hover { transform: scale(1.03); }

  /* HERO */
  .lp-hero { background: linear-gradient(160deg, #FF7043 0%, #FF8A65 35%, #FFAB76 70%, #FFD699 100%); padding: 60px 24px 0; text-align: center; color: #fff; position: relative; overflow: hidden; }
  .lp-hero::before { content: ''; position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; background: rgba(255,255,255,0.07); border-radius: 50%; }
  .lp-hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.2); font-size: 11px; font-weight: 700; padding: 6px 16px; border-radius: 20px; margin-bottom: 18px; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); }
  .lp-pulse { width: 6px; height: 6px; background: #A5D6A7; border-radius: 50%; display: inline-block; animation: lp-pulse 2s infinite; }
  @keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
  .lp-hero-h1 { font-size: 26px; font-weight: 900; line-height: 1.3; margin-bottom: 14px; position: relative; z-index: 1; }
  .lp-hero-h1 em { font-style: normal; position: relative; }
  .lp-hero-h1 em::after { content: ''; position: absolute; bottom: 2px; left: 0; right: 0; height: 8px; background: rgba(255,255,255,0.25); border-radius: 4px; z-index: -1; }
  .lp-hero-p { font-size: 15px; line-height: 1.65; opacity: 0.95; margin-bottom: 24px; position: relative; z-index: 1; }
  .lp-btn-white { display: inline-block; background: #fff; color: #FF7043; font-family: inherit; font-size: 16px; font-weight: 800; padding: 15px 36px; border-radius: 50px; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.12); transition: transform 0.2s; position: relative; z-index: 1; }
  .lp-btn-white:hover { transform: scale(1.03); }
  .lp-hero-sub { display: block; font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 10px; position: relative; z-index: 1; }

  /* PHONE MOCKUP */
  .lp-phone-wrapper { position: relative; z-index: 2; margin-top: 28px; padding: 0 20px; }
  .lp-phone { background: #1a1a1a; border-radius: 32px 32px 0 0; padding: 12px 10px 0; max-width: 300px; margin: 0 auto; box-shadow: 0 -4px 40px rgba(0,0,0,0.15); position: relative; }
  .lp-phone-notch { width: 100px; height: 22px; background: #1a1a1a; border-radius: 0 0 14px 14px; position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 5; }
  .lp-phone-inner { background: #F8F9FA; border-radius: 22px 22px 0 0; overflow: hidden; padding: 28px 14px 18px; }
  .lp-app-status { display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-bottom: 12px; padding: 0 4px; }
  .lp-app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding: 0 2px; }
  .lp-app-greeting { font-size: 11px; color: #888; }
  .lp-app-name { font-size: 16px; font-weight: 800; color: #222; margin-top: 1px; }
  .lp-app-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #FF8A65, #FFAB76); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #fff; font-weight: 800; }
  .lp-app-date { display: inline-flex; align-items: center; gap: 4px; background: #fff; border: 1px solid #eee; border-radius: 20px; padding: 5px 12px; font-size: 11px; color: #555; font-weight: 600; margin-bottom: 14px; }
  .lp-app-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .lp-app-card { background: #fff; border-radius: 12px; padding: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; }
  .lp-app-card.lp-alert { border-left: 3px solid #FFA726; }
  .lp-sc-top { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; font-size: 14px; }
  .lp-sc-label { font-size: 10px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
  .lp-sc-value { font-size: 18px; font-weight: 800; color: #222; line-height: 1.1; }
  .lp-text-alert { color: #E65100 !important; }
  .lp-text-good { color: #2E7D32 !important; }
  .lp-sc-sub { font-size: 9px; color: #aaa; margin-top: 1px; }
  .lp-event-row { display: flex; align-items: center; gap: 8px; background: #fff; border-radius: 10px; padding: 8px 10px; margin-bottom: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); border: 1px solid #f5f5f5; }
  .lp-ev-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
  .lp-ev-info { flex: 1; }
  .lp-ev-title { font-size: 11px; font-weight: 700; color: #333; }
  .lp-ev-detail { font-size: 9px; color: #999; }
  .lp-ev-time { font-size: 9px; color: #bbb; font-weight: 600; }

  /* TRUST */
  .lp-trust { display: flex; justify-content: center; align-items: center; gap: 24px; padding: 18px 24px; background: #FAFAFA; border-bottom: 1px solid #f0f0f0; }
  .lp-trust-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #777; font-weight: 600; }

  /* STATS */
  .lp-stats { display: flex; justify-content: center; gap: 32px; padding: 24px; background: #fff; }
  .lp-stat { text-align: center; }
  .lp-stat-num { font-size: 28px; font-weight: 900; color: #FF7043; letter-spacing: -1px; }
  .lp-stat-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-top: 2px; }

  /* SECTIONS */
  .lp-section { padding: 40px 24px; }
  .lp-tag { font-size: 11px; font-weight: 700; color: #FF7043; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
  .lp-h2 { font-size: 22px; font-weight: 900; line-height: 1.35; margin-bottom: 20px; color: #1a1a1a; letter-spacing: -0.3px; }

  /* EMPATHY */
  .lp-empathy { background: #FFF8F5; border-top: 3px solid #FFCCBC; }
  .lp-empathy-quote { font-size: 18px; font-weight: 700; color: #BF360C; line-height: 1.5; margin-bottom: 20px; font-style: italic; padding-left: 16px; border-left: 3px solid #FF8A65; }
  .lp-pain-cards { display: flex; flex-direction: column; gap: 10px; }
  .lp-pain-card { display: flex; gap: 12px; padding: 14px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #FFE0CC; }
  .lp-pc-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
  .lp-pc-title { font-size: 14px; font-weight: 800; color: #222; margin-bottom: 3px; }
  .lp-pc-desc { font-size: 13px; color: #777; line-height: 1.5; }

  /* TRANSFORM */
  .lp-transform { background: #1a1a1a; padding: 40px 24px; position: relative; overflow: hidden; }
  .lp-transform::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 70% 20%, rgba(255,112,67,0.08) 0%, transparent 50%); }
  .lp-ba-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: #333; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
  .lp-ba-col { padding: 18px 14px; }
  .lp-before { background: #2a2a2a; }
  .lp-after { background: #1E3A2F; }
  .lp-ba-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .lp-ba-item { display: flex; align-items: flex-start; gap: 6px; padding: 6px 0; font-size: 12px; color: #aaa; line-height: 1.45; }
  .lp-transform-result { background: linear-gradient(135deg, #FF7043, #FF8A65); border-radius: 14px; padding: 20px; text-align: center; color: #fff; position: relative; z-index: 1; }
  .lp-tr-big { font-size: 28px; font-weight: 900; margin-bottom: 4px; }
  .lp-tr-sub { font-size: 13px; opacity: 0.9; line-height: 1.5; }

  /* CALC */
  .lp-calc-section { background: #FFF5EE; }
  .lp-calc-card { background: #fff; border-radius: 16px; padding: 24px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 16px; }
  .lp-calc-step { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-bottom: 1px dashed #eee; }
  .lp-calc-step:last-child { border-bottom: none; }
  .lp-calc-num { width: 32px; height: 32px; background: #FF7043; color: #fff; font-size: 14px; font-weight: 800; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-calc-text { flex: 1; }
  .lp-calc-label { font-size: 13px; color: #888; margin-bottom: 2px; }
  .lp-calc-value { font-size: 20px; font-weight: 800; color: #FF7043; }
  .lp-calc-detail { font-size: 13px; color: #666; margin-top: 2px; line-height: 1.5; }
  .lp-calc-result { background: linear-gradient(135deg, #FF7043, #FF8A65); border-radius: 14px; padding: 22px; text-align: center; color: #fff; }
  .lp-cr-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85; margin-bottom: 6px; font-weight: 700; }
  .lp-cr-num { font-size: 32px; font-weight: 900; line-height: 1.2; }
  .lp-cr-note { font-size: 13px; opacity: 0.9; margin-top: 6px; line-height: 1.5; }

  /* ROLES */
  .lp-role-section { background: #FFF5EE; }
  .lp-role-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
  .lp-role-card { display: flex; align-items: center; gap: 14px; background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #f5f0eb; }
  .lp-role-icon { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .lp-role-name { font-size: 15px; font-weight: 800; color: #222; }
  .lp-role-desc { font-size: 13px; color: #777; line-height: 1.45; margin-top: 2px; }

  /* FEATURES */
  .lp-features-section { background: #FAFAFA; }
  .lp-features-grid { display: flex; flex-direction: column; gap: 14px; }
  .lp-feature-card { background: #fff; border-radius: 16px; padding: 20px 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #f0f0f0; }
  .lp-feature-hl { border: 1px solid #FFCCBC; background: linear-gradient(180deg, #FFFBF5 0%, #fff 100%); }
  .lp-feature-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .lp-feature-emoji { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .lp-feature-title { font-size: 16px; font-weight: 800; color: #222; }
  .lp-feature-desc { font-size: 13.5px; color: #666; line-height: 1.6; }
  .lp-feature-peek { display: inline-flex; align-items: center; gap: 4px; margin-top: 10px; font-size: 12px; font-weight: 700; color: #FF7043; background: #FFF5EE; padding: 4px 10px; border-radius: 6px; }

  /* MOCKUP SM */
  .lp-mockup-section { text-align: center; background: linear-gradient(180deg, #FAFAFA 0%, #fff 100%); }
  .lp-phone-mockup-sm { background: #1a1a1a; border-radius: 28px; padding: 10px; max-width: 260px; margin: 20px auto; box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
  .lp-pm-screen { border-radius: 20px; overflow: hidden; background: #F8F9FA; padding: 16px 12px 14px; }
  .lp-pm-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding: 0 2px; font-size: 13px; }
  .lp-pm-log { display: flex; align-items: center; gap: 8px; background: #fff; border-radius: 10px; padding: 8px 10px; margin-bottom: 5px; border: 1px solid #f0f0f0; }
  .lp-pm-icon { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
  .lp-pm-add { margin-top: 10px; background: linear-gradient(135deg, #FF7043, #FF8A65); border-radius: 10px; padding: 10px; text-align: center; color: #fff; font-size: 12px; font-weight: 700; }

  /* TESTIMONIALS */
  .lp-testi-section { background: linear-gradient(180deg, #FFF8F5 0%, #FFF 100%); }
  .lp-testi-intro { font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 24px; }
  .lp-testi-grid { display: flex; flex-direction: column; gap: 16px; }
  .lp-testi-card { background: #fff; border-radius: 16px; padding: 22px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f5f0eb; position: relative; }
  .lp-testi-card::before { content: '"'; position: absolute; top: 14px; right: 18px; font-size: 48px; font-weight: 900; color: #FFE0CC; line-height: 1; font-family: Georgia, serif; }
  .lp-testi-hl { border: 2px solid #FFCCBC; background: linear-gradient(180deg, #FFFAF5 0%, #fff 100%); }
  .lp-testi-stars { color: #FFC107; font-size: 14px; margin-bottom: 10px; letter-spacing: 2px; }
  .lp-testi-metric { display: inline-flex; align-items: center; gap: 6px; background: #FFF5EE; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #E65100; }
  .lp-testi-quote { font-size: 14px; color: #444; line-height: 1.65; margin-bottom: 16px; position: relative; z-index: 1; }
  .lp-testi-quote strong { color: #222; }
  .lp-testi-author { display: flex; align-items: center; gap: 10px; padding-top: 14px; border-top: 1px solid #f5f0eb; }
  .lp-testi-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .lp-testi-name { font-size: 13px; font-weight: 800; color: #222; }
  .lp-testi-role-text { font-size: 11px; color: #999; }
  .lp-testi-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; color: #2E7D32; background: #E8F5E9; padding: 2px 8px; border-radius: 10px; margin-top: 3px; }

  /* PRICING */
  .lp-price-section { background: linear-gradient(160deg, #FF7043, #FF8A65, #FFAB76); padding: 40px 24px; text-align: center; color: #fff; position: relative; overflow: hidden; }
  .lp-price-section::before { content: ''; position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; background: rgba(255,255,255,0.06); border-radius: 50%; }
  .lp-price-tag { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; margin-bottom: 10px; font-weight: 700; }
  .lp-price-h2 { font-size: 24px; font-weight: 900; margin-bottom: 6px; color: #fff; line-height: 1.35; }
  .lp-price-box { background: #fff; border-radius: 20px; padding: 32px 24px; color: #333; box-shadow: 0 12px 40px rgba(0,0,0,0.12); position: relative; z-index: 1; }
  .lp-price-ribbon { position: absolute; top: -1px; right: 20px; background: #FF7043; color: #fff; font-size: 10px; font-weight: 800; padding: 6px 12px 8px; border-radius: 0 0 8px 8px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 8px rgba(255,112,67,0.3); }
  /* Trial banner */
  .lp-trial-banner { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); border-radius: 14px; padding: 16px; margin-bottom: 20px; text-align: left; position: relative; z-index: 1; }
  .lp-trial-icon { font-size: 28px; flex-shrink: 0; }
  .lp-trial-title { font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 2px; }
  .lp-trial-desc { font-size: 12px; color: rgba(255,255,255,0.85); }
  /* Plan name */
  .lp-plan-name { font-size: 20px; font-weight: 900; color: #222; letter-spacing: -0.5px; margin-bottom: 2px; }
  .lp-plan-for { font-size: 13px; color: #999; margin-bottom: 12px; font-weight: 600; }
  /* Price amount */
  .lp-price-amount { font-size: 52px; font-weight: 900; color: #FF7043; line-height: 1; letter-spacing: -2px; }
  .lp-price-rp { font-size: 22px; vertical-align: super; font-weight: 700; margin-right: 2px; }
  .lp-price-rb { font-size: 22px; font-weight: 700; }
  .lp-price-period { font-size: 14px; color: #999; margin-bottom: 20px; }
  .lp-price-save-tag { display: inline-block; background: #FFF3E0; color: #E65100; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
  /* Premium card */
  .lp-price-premium { margin-top: 16px; border: 2px solid #FFAB76; background: linear-gradient(180deg, #FFFAF5 0%, #fff 100%); }
  .lp-ribbon-premium { background: #E65100 !important; }
  .lp-check-gold { background: #FFF3E0 !important; color: #E65100 !important; }
  .lp-price-guarantee { font-size: 13px; color: rgba(255,255,255,0.85); line-height: 1.6; margin-top: 20px; padding: 14px; background: rgba(255,255,255,0.12); border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); position: relative; z-index: 1; text-align: center; }
  .lp-bonus-list { list-style: none; text-align: left; margin-bottom: 24px; padding: 0; }
  .lp-bonus-list li { padding: 8px 0; font-size: 14px; color: #555; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #f8f8f8; }
  .lp-bonus-list li:last-child { border-bottom: none; }
  .lp-check { width: 20px; height: 20px; background: #E8F5E9; color: #2E7D32; font-weight: 800; font-size: 12px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-btn-orange-block { display: block; width: 100%; background: linear-gradient(135deg, #FF7043, #FF8A65); color: #fff; font-family: inherit; font-size: 16px; font-weight: 800; padding: 15px; border-radius: 50px; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(255,112,67,0.35); transition: transform 0.2s; text-align: center; }
  .lp-btn-orange-block:hover { transform: scale(1.03); }
  .lp-guarantee { font-size: 13px; color: #777; line-height: 1.6; margin-top: 16px; padding: 14px; background: #F0FFF4; border-radius: 12px; border: 1px solid #C8E6C9; }

  /* FAQ */
  .lp-faq-section { background: #FAFAFA; }
  .lp-faq-item { border-bottom: 1px solid #eee; padding: 18px 0; cursor: pointer; }
  .lp-faq-q { font-size: 15px; font-weight: 700; color: #222; display: flex; justify-content: space-between; align-items: center; gap: 12px; line-height: 1.4; }
  .lp-faq-toggle { width: 26px; height: 26px; background: #FFF5EE; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #FF7043; flex-shrink: 0; transition: transform 0.3s; }
  .lp-faq-item.open .lp-faq-toggle { transform: rotate(45deg); }
  .lp-faq-a { font-size: 14px; color: #666; line-height: 1.65; }

  /* FINAL CTA */
  .lp-final-cta { padding: 44px 24px; text-align: center; background: linear-gradient(180deg, #fff 0%, #FFF8F5 100%); }
  .lp-urgency { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #E65100; background: #FFF3E0; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
  .lp-btn-orange { display: inline-block; background: linear-gradient(135deg, #FF7043, #FF8A65); color: #fff; font-family: inherit; font-size: 16px; font-weight: 800; padding: 15px 36px; border-radius: 50px; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(255,112,67,0.35); transition: transform 0.2s; }
  .lp-btn-orange:hover { transform: scale(1.03); }

  /* FOOTER */
  .lp-footer { text-align: center; padding: 28px 24px; background: #1a1a1a; color: #888; font-size: 12px; line-height: 1.7; }
  .lp-footer-brand { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px; }

  /* ANIMATIONS — Hero fade-up */
  @keyframes lp-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .lp-hero-h1, .lp-hero-p, .lp-hero-badge, .lp-phone { animation: lp-fadeUp 0.6s ease-out both; }
  .lp-hero-badge { animation-delay: 0s; }
  .lp-hero-h1 { animation-delay: 0.1s; }
  .lp-hero-p { animation-delay: 0.2s; }
  .lp-phone { animation-delay: 0.4s; }

  /* SCROLL REVEAL — sections fade in on scroll */
  .lp-reveal {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: opacity, transform;
  }
  .lp-visible {
    opacity: 1;
    transform: translateY(0) !important;
  }

  /* Staggered children inside revealed sections */
  .lp-visible .lp-pain-card,
  .lp-visible .lp-role-card,
  .lp-visible .lp-feature-card,
  .lp-visible .lp-testi-card,
  .lp-visible .lp-calc-step,
  .lp-visible .lp-ba-col,
  .lp-visible .lp-faq-item {
    animation: lp-childReveal 0.5s ease-out both;
  }
  .lp-visible .lp-pain-card:nth-child(1), .lp-visible .lp-role-card:nth-child(1), .lp-visible .lp-feature-card:nth-child(1), .lp-visible .lp-testi-card:nth-child(1), .lp-visible .lp-calc-step:nth-child(1), .lp-visible .lp-faq-item:nth-child(1) { animation-delay: 0.05s; }
  .lp-visible .lp-pain-card:nth-child(2), .lp-visible .lp-role-card:nth-child(2), .lp-visible .lp-feature-card:nth-child(2), .lp-visible .lp-testi-card:nth-child(2), .lp-visible .lp-calc-step:nth-child(2), .lp-visible .lp-faq-item:nth-child(2) { animation-delay: 0.12s; }
  .lp-visible .lp-pain-card:nth-child(3), .lp-visible .lp-role-card:nth-child(3), .lp-visible .lp-feature-card:nth-child(3), .lp-visible .lp-testi-card:nth-child(3), .lp-visible .lp-calc-step:nth-child(3), .lp-visible .lp-faq-item:nth-child(3) { animation-delay: 0.19s; }
  .lp-visible .lp-pain-card:nth-child(4), .lp-visible .lp-feature-card:nth-child(4), .lp-visible .lp-testi-card:nth-child(4), .lp-visible .lp-faq-item:nth-child(4) { animation-delay: 0.26s; }
  .lp-visible .lp-feature-card:nth-child(5), .lp-visible .lp-faq-item:nth-child(5) { animation-delay: 0.33s; }
  .lp-visible .lp-feature-card:nth-child(6), .lp-visible .lp-faq-item:nth-child(6) { animation-delay: 0.40s; }
  .lp-visible .lp-ba-col:nth-child(1) { animation-delay: 0.05s; }
  .lp-visible .lp-ba-col:nth-child(2) { animation-delay: 0.15s; }

  @keyframes lp-childReveal {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* FLOAT — gentle bobbing for phone mockups */
  @keyframes lp-float-bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-10px); }
  }
  .lp-float {
    animation: lp-float-bob 4s ease-in-out infinite;
  }
  /* Override hero phone: fadeUp first, then float */
  .lp-phone.lp-float {
    animation: lp-fadeUp 0.6s ease-out both, lp-float-bob 4s ease-in-out 0.8s infinite;
    animation-delay: 0.4s, 1.2s;
  }

  /* HOVER — interactive card effects */
  .lp-pain-card,
  .lp-role-card,
  .lp-feature-card,
  .lp-testi-card,
  .lp-price-box,
  .lp-calc-card {
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease;
  }
  .lp-pain-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 8px 24px rgba(255,112,67,0.10); }
  .lp-role-card:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .lp-feature-card:hover { transform: translateY(-5px) scale(1.015); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
  .lp-testi-card:hover { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(0,0,0,0.08); }
  .lp-price-box:hover { transform: translateY(-6px) scale(1.015); box-shadow: 0 16px 48px rgba(0,0,0,0.14); }

  /* SHIMMER — badge & CTA shine */
  @keyframes lp-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .lp-hero-badge {
    background: linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.15) 100%);
    background-size: 200% 100%;
    animation: lp-fadeUp 0.6s ease-out both, lp-shimmer 3s ease-in-out 1.5s infinite;
  }
  .lp-urgency {
    background: linear-gradient(90deg, #FFF3E0 0%, #FFE0B2 50%, #FFF3E0 100%);
    background-size: 200% 100%;
    animation: lp-shimmer 3s ease-in-out infinite;
  }

  /* PULSE — CTA buttons gentle pulse */
  @keyframes lp-btnPulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(255,112,67,0.35); }
    50%      { box-shadow: 0 4px 28px rgba(255,112,67,0.55); }
  }
  .lp-btn-orange, .lp-btn-orange-block {
    animation: lp-btnPulse 2.5s ease-in-out infinite;
  }
  .lp-btn-orange:hover, .lp-btn-orange-block:hover {
    animation: none;
    transform: scale(1.04);
    box-shadow: 0 6px 24px rgba(255,112,67,0.5);
  }

  /* STAT COUNTER — number pop effect */
  .lp-stat-num {
    transition: transform 0.3s ease;
  }
  .lp-stat:hover .lp-stat-num {
    transform: scale(1.12);
  }

  /* TRUST BAR — slide in */
  .lp-trust-item {
    animation: lp-fadeUp 0.5s ease-out both;
  }
  .lp-trust-item:nth-child(1) { animation-delay: 0.5s; }
  .lp-trust-item:nth-child(2) { animation-delay: 0.65s; }
  .lp-trust-item:nth-child(3) { animation-delay: 0.8s; }

  /* FAQ toggle smooth transition */
  .lp-faq-a {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    display: block !important;
    transition: max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease, margin-top 0.3s ease;
    margin-top: 0;
  }
  .lp-faq-item.open .lp-faq-a {
    max-height: 300px;
    opacity: 1;
    margin-top: 12px;
  }

  /* TRANSFORM RESULT — gradient shift */
  @keyframes lp-gradShift {
    0%, 100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  .lp-transform-result {
    background: linear-gradient(135deg, #FF7043, #FF8A65, #FFAB76, #FF8A65);
    background-size: 300% 300%;
    animation: lp-gradShift 5s ease-in-out infinite;
  }

  /* CALC RESULT — gradient shift */
  .lp-calc-result {
    background: linear-gradient(135deg, #FF7043, #FF8A65, #FFAB76, #FF8A65);
    background-size: 300% 300%;
    animation: lp-gradShift 5s ease-in-out infinite;
  }

  /* TRIAL BANNER — soft glow */
  @keyframes lp-glowPulse {
    0%, 100% { border-color: rgba(255,255,255,0.2); }
    50%      { border-color: rgba(255,255,255,0.45); }
  }
  .lp-trial-banner {
    animation: lp-glowPulse 3s ease-in-out infinite;
  }

  /* PRICE RIBBON — bounce on reveal */
  .lp-visible .lp-price-ribbon {
    animation: lp-ribbonBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
  }
  @keyframes lp-ribbonBounce {
    from { opacity: 0; transform: translateY(-12px) scale(0.85); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ═══════════════════════════════════════════════════
     TABLET — 768px+
     ═══════════════════════════════════════════════════ */
  @media (min-width: 768px) {
    .lp-root { max-width: 720px; }
    .lp-nav-inner { max-width: 720px; padding: 12px 32px; }
    .lp-logo-text { font-size: 17px; }
    .lp-nav-btn { font-size: 14px; padding: 10px 24px; }

    .lp-hero { padding: 80px 40px 0; }
    .lp-hero-h1 { font-size: 36px; }
    .lp-hero-p { font-size: 17px; max-width: 500px; margin-left: auto; margin-right: auto; }
    .lp-hero-badge { font-size: 12px; padding: 8px 20px; }
    .lp-phone { max-width: 340px; }

    .lp-trust { gap: 40px; padding: 22px 32px; }
    .lp-trust-item { font-size: 13px; }

    .lp-stats { gap: 48px; padding: 32px; }
    .lp-stat-num { font-size: 36px; }
    .lp-stat-label { font-size: 12px; }

    .lp-section { padding: 56px 40px; }
    .lp-h2 { font-size: 26px; }
    .lp-tag { font-size: 12px; }

    .lp-empathy-quote { font-size: 20px; }
    .lp-pain-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .lp-transform { padding: 56px 40px; }
    .lp-ba-col { padding: 24px 20px; }
    .lp-ba-item { font-size: 13px; }
    .lp-tr-big { font-size: 32px; }

    .lp-calc-card { padding: 28px; }
    .lp-calc-value { font-size: 22px; }

    .lp-role-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .lp-role-card { flex-direction: column; text-align: center; padding: 24px 16px; }
    .lp-role-icon { width: 56px; height: 56px; font-size: 28px; }

    .lp-features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .lp-phone-mockup-sm { max-width: 300px; }

    .lp-testi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }

    .lp-price-section { padding: 56px 40px; display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; }
    .lp-price-section > .lp-price-tag,
    .lp-price-section > .lp-price-h2,
    .lp-price-section > p,
    .lp-price-section > .lp-trial-banner,
    .lp-price-section > .lp-price-guarantee { width: 100%; flex-basis: 100%; }
    .lp-price-box { flex: 1; min-width: 280px; max-width: 340px; }
    .lp-price-premium { margin-top: 0; }

    .lp-faq-section { max-width: 640px; margin-left: auto; margin-right: auto; }

    .lp-final-cta { padding: 60px 40px; }
    .lp-final-cta .lp-h2 { font-size: 28px; }

    .lp-footer { padding: 36px 40px; }
    .lp-footer-brand { font-size: 18px; }
  }

  /* ═══════════════════════════════════════════════════
     DESKTOP — 1024px+
     ═══════════════════════════════════════════════════ */
  @media (min-width: 1024px) {
    .lp-root { max-width: 960px; }
    .lp-nav-inner { max-width: 960px; padding: 14px 40px; }
    .lp-logo-text { font-size: 18px; }
    .lp-nav-btn { font-size: 15px; padding: 11px 28px; }

    .lp-hero { padding: 100px 60px 0; }
    .lp-hero-h1 { font-size: 44px; line-height: 1.25; }
    .lp-hero-p { font-size: 18px; max-width: 560px; }
    .lp-hero-badge { font-size: 13px; padding: 8px 22px; }
    .lp-hero::before { width: 320px; height: 320px; top: -100px; right: -100px; }
    .lp-phone { max-width: 380px; }
    .lp-phone-wrapper { margin-top: 36px; }

    .lp-trust { gap: 56px; padding: 26px 40px; }
    .lp-trust-item { font-size: 14px; gap: 8px; }

    .lp-stats { gap: 64px; padding: 40px; }
    .lp-stat-num { font-size: 42px; }
    .lp-stat-label { font-size: 13px; }

    .lp-section { padding: 72px 60px; }
    .lp-h2 { font-size: 30px; }
    .lp-tag { font-size: 12px; letter-spacing: 2.5px; }

    .lp-empathy-quote { font-size: 22px; max-width: 600px; }
    .lp-pain-cards { grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }
    .lp-pain-card { flex-direction: column; text-align: center; padding: 20px 16px; }
    .lp-pc-icon { font-size: 28px; margin-top: 0; }

    .lp-transform { padding: 72px 60px; }
    .lp-ba-grid { max-width: 700px; margin-left: auto; margin-right: auto; margin-bottom: 24px; }
    .lp-ba-col { padding: 28px 24px; }
    .lp-ba-item { font-size: 14px; }
    .lp-tr-big { font-size: 36px; }

    .lp-calc-card { max-width: 700px; margin-left: auto; margin-right: auto; margin-bottom: 20px; padding: 32px; }
    .lp-calc-value { font-size: 24px; }
    .lp-calc-detail { font-size: 14px; }
    .lp-calc-result { max-width: 700px; margin-left: auto; margin-right: auto; }
    .lp-cr-num { font-size: 36px; }

    .lp-role-card { padding: 28px 20px; }
    .lp-role-name { font-size: 17px; }
    .lp-role-desc { font-size: 14px; }

    .lp-features-grid { grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .lp-feature-title { font-size: 17px; }
    .lp-feature-desc { font-size: 14px; }

    .lp-phone-mockup-sm { max-width: 320px; }

    .lp-testi-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
    .lp-testi-quote { font-size: 15px; }

    .lp-price-section { padding: 72px 60px; }
    .lp-price-box { max-width: 380px; padding: 36px 28px; }
    .lp-price-h2 { font-size: 28px; }
    .lp-price-amount { font-size: 56px; }

    .lp-faq-section { max-width: 840px; }

    .lp-final-cta { padding: 80px 60px; }
    .lp-final-cta .lp-h2 { font-size: 32px; max-width: 600px; margin-left: auto; margin-right: auto; }
    .lp-btn-orange { font-size: 18px; padding: 17px 44px; }

    .lp-footer { padding: 44px 60px; }
    .lp-footer-brand { font-size: 20px; }
  }

  /* MOBILE touch feedback */
  @media (hover: none) {
    .lp-pain-card:active, .lp-role-card:active, .lp-feature-card:active, .lp-testi-card:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
    .lp-btn-orange:active, .lp-btn-orange-block:active, .lp-nav-btn:active {
      transform: scale(0.96);
      transition: transform 0.1s ease;
    }
  }

  /* PREFERS REDUCED MOTION */
  @media (prefers-reduced-motion: reduce) {
    .lp-reveal { transition: none; opacity: 1; transform: none; }
    .lp-float { animation: none !important; }
    .lp-hero-h1, .lp-hero-p, .lp-hero-badge, .lp-phone { animation: none !important; opacity: 1; transform: none; }
    .lp-trust-item { animation: none !important; opacity: 1; }
    .lp-btn-orange, .lp-btn-orange-block { animation: none !important; }
    .lp-urgency { animation: none !important; }
    .lp-transform-result, .lp-calc-result { animation: none !important; }
    .lp-trial-banner { animation: none !important; }
  }
`;
