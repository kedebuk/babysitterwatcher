import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, MapPin, Camera, BarChart3, MessageCircle, Brain, Baby, Shield, Clock, Heart } from 'lucide-react';

const features = [
  {
    icon: ClipboardList,
    title: 'Timeline Aktivitas',
    description: 'Feed real-time dari setiap aktivitas — makan, tidur siang, bermain, ganti popok — dicatat dengan waktu dan catatan oleh pengasuh Anda.',
  },
  {
    icon: MapPin,
    title: 'Cek Lokasi GPS',
    description: 'Ketahui persis di mana anak Anda berada setiap saat. Ping lokasi otomatis dan notifikasi geofence untuk ketenangan ekstra.',
  },
  {
    icon: Camera,
    title: 'Update Foto & Video',
    description: 'Terima update foto dan video real-time sepanjang hari. Bangun galeri kenangan indah dari aktivitas anak Anda.',
  },
  {
    icon: BarChart3,
    title: 'Laporan Harian',
    description: 'Ringkasan akhir hari dengan detail aktivitas, pelacakan suasana hati, dan milestone perkembangan.',
  },
  {
    icon: MessageCircle,
    title: 'Pesan Instan',
    description: 'Tetap terhubung dengan pengasuh melalui pesan dalam aplikasi yang aman. Bagikan instruksi dan info darurat dengan mudah.',
  },
  {
    icon: Brain,
    title: 'Insight Cerdas',
    description: 'Pengenalan pola berbasis AI membantu mengidentifikasi tren tidur, kebiasaan makan, dan saran perawatan yang dipersonalisasi.',
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-3xl space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <Heart className="h-10 w-10 text-primary" fill="hsl(var(--primary))" opacity={0.8} />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Eleanor Tracker</p>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Pantau Si Kecil,<br />
              <span className="text-primary">Dengan Penuh Cinta</span>
            </h1>
          </div>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
            Aplikasi monitoring pengasuh anak yang membantu Mama tetap terhubung dengan aktivitas harian si kecil secara real-time.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" className="h-13 px-10 text-base font-bold rounded-full shadow-lg" onClick={() => navigate('/login')}>
              Mulai Sekarang
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-10 text-base font-bold rounded-full" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Lihat Fitur
            </Button>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y bg-secondary/40 px-4 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 text-sm font-semibold text-muted-foreground">
          <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Data Terenkripsi</span>
          <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Update Real-time</span>
          <span className="flex items-center gap-2"><Baby className="h-4 w-4 text-primary" /> Multi-anak</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-primary">Fitur</p>
          <h2 className="mb-3 text-center font-display text-3xl font-bold text-foreground sm:text-4xl">Semua yang Mama Butuhkan</h2>
          <p className="mb-12 text-center text-muted-foreground">Pantau pengasuhan anak dengan lengkap dan tenang</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border bg-card p-7 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-card-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] p-10 text-center text-primary-foreground sm:p-14">
          <h2 className="mb-3 font-display text-3xl font-bold sm:text-4xl">Siap Memulai?</h2>
          <p className="mb-8 text-lg opacity-90">Daftar gratis dan mulai pantau aktivitas si kecil hari ini.</p>
          <Button size="lg" variant="secondary" className="h-13 px-10 text-base font-bold rounded-full shadow-lg" onClick={() => navigate('/login')}>
            Daftar Sekarang
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8 text-center">
        <p className="font-display text-lg font-semibold text-foreground">Eleanor Tracker</p>
        <p className="mt-1 text-xs text-muted-foreground">© {new Date().getFullYear()} Eleanor Tracker. Made with love for Mamas.</p>
      </footer>
    </div>
  );
};

export default Index;
