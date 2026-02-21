import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, MapPin, Camera, BarChart3, MessageCircle, Brain, Baby, Shield, Clock } from 'lucide-react';

const features = [
  {
    icon: ClipboardList,
    title: 'Timeline Aktivitas',
    description: 'Feed real-time dari setiap aktivitas — makan, tidur siang, bermain, ganti popok — dicatat dengan waktu dan catatan oleh pengasuh Anda.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: MapPin,
    title: 'Cek Lokasi GPS',
    description: 'Ketahui persis di mana anak Anda berada setiap saat. Ping lokasi otomatis dan notifikasi geofence untuk ketenangan ekstra.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Camera,
    title: 'Update Foto & Video',
    description: 'Terima update foto dan video real-time sepanjang hari. Bangun galeri kenangan indah dari aktivitas anak Anda.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: BarChart3,
    title: 'Laporan Harian',
    description: 'Ringkasan akhir hari dengan detail aktivitas, pelacakan suasana hati, dan milestone perkembangan yang divisualisasikan dengan cantik.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: MessageCircle,
    title: 'Pesan Instan',
    description: 'Tetap terhubung dengan pengasuh melalui pesan dalam aplikasi yang aman. Bagikan instruksi, catatan, dan info darurat dengan mudah.',
    color: 'bg-slate-100 text-slate-600',
  },
  {
    icon: Brain,
    title: 'Insight Cerdas',
    description: 'Pengenalan pola berbasis AI membantu mengidentifikasi tren tidur, kebiasaan makan, dan memberikan saran perawatan yang dipersonalisasi.',
    color: 'bg-pink-100 text-pink-600',
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="relative mx-auto max-w-3xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Baby className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Pantau Anak Anda,<br />
            <span className="text-primary">Kapan Saja & Di Mana Saja</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Aplikasi monitoring pengasuh anak yang membantu orang tua tetap terhubung dengan aktivitas harian si kecil secara real-time.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" className="h-12 px-8 text-base font-bold" onClick={() => navigate('/login')}>
              Mulai Sekarang
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base font-bold" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Lihat Fitur
            </Button>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y bg-muted/30 px-4 py-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 text-sm font-medium text-muted-foreground">
          <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Data Terenkripsi</span>
          <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Update Real-time</span>
          <span className="flex items-center gap-2"><Baby className="h-4 w-4 text-primary" /> Multi-anak</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground sm:text-3xl">Fitur Lengkap</h2>
          <p className="mb-10 text-center text-muted-foreground">Semua yang Anda butuhkan untuk memantau pengasuhan anak</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
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
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">Siap Memulai?</h2>
          <p className="mb-6 opacity-90">Daftar gratis dan mulai pantau aktivitas anak Anda hari ini.</p>
          <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-bold" onClick={() => navigate('/login')}>
            Daftar Sekarang
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BabysitterWatcher. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
