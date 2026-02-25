import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Baby, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable/index';
import { useBrand } from '@/contexts/BrandContext';
import { Separator } from '@/components/ui/separator';
import { usePixel } from '@/components/MetaPixelProvider';

const Login = () => {
  const { brandName, brandLogoUrl } = useBrand();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'parent' | 'babysitter'>('parent');

  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const { user, loading: authLoading, login, signup } = useAuth();
  const { toast } = useToast();
  const { trackEvent } = usePixel();
  const { setTheme, theme } = useTheme();

  // Force light theme on login page
  useEffect(() => {
    const prev = theme;
    setTheme('light');
    return () => { if (prev && prev !== 'light') setTheme(prev); };
  }, []);

  // Event saat user masuk halaman login (Lead / InitiateCheckout) sekali per sesi
  useEffect(() => {
    if (authLoading) return;
    if (user) return;

    const key = 'pixel_landing_tracked';
    if (!sessionStorage.getItem(key)) {
      trackEvent('pixel_event_landing');
      sessionStorage.setItem(key, 'true');
    }
  }, [authLoading, user, trackEvent]);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast({ title: 'Error', description: 'Masukkan email Anda', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Email terkirim!', description: 'Cek inbox email Anda untuk link reset password.' });
      setShowForgot(false);
    }
  };

  // Track Google signup event untuk user baru yang balik dari OAuth
  useEffect(() => {
    if (!authLoading && user) {
      const googleSignupTracked = sessionStorage.getItem('google_signup_tracked');
      if (!googleSignupTracked) {
        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthParams = window.location.hash.includes('access_token') || urlParams.has('code');
        if (hasAuthParams) {
          trackEvent('pixel_event_signup');
          sessionStorage.setItem('google_signup_tracked', 'true');
        }
      }
    }
  }, [authLoading, user, trackEvent]);

  // Redirect if already logged in
  if (!authLoading && user) {
    if (!user.phoneComplete) return <Navigate to="/complete-phone" replace />;
    if ((user.roles?.length ?? 0) > 1) return <Navigate to="/choose-role" replace />;
    const dest =
      user.role === 'admin'
        ? '/admin/dashboard'
        : user.role === 'parent'
        ? '/parent/dashboard'
        : '/babysitter/today';
    return <Navigate to={dest} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      toast({ title: 'Login gagal', description: result.error, variant: 'destructive' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password minimal 6 karakter', variant: 'destructive' });
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      toast({ title: 'Error', description: 'Masukkan nomor HP WhatsApp yang valid', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const result = await signup(email, password, name, role);

    if (result.success) {
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from('profiles').update({ phone: phone.trim() } as any).eq('id', session.user.id);
        }
      }, 1000);

      trackEvent('pixel_event_signup');
      toast({ title: '✅ Akun dibuat!', description: 'Silakan login dengan akun baru Anda' });
    } else {
      toast({ title: 'Daftar gagal', description: result.error, variant: 'destructive' });
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
      extraParams: { prompt: 'select_account' },
    });

    if (result?.error) {
      toast({ title: 'Google login gagal', description: String(result.error), variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden light" data-theme="light" style={{ colorScheme: 'light' }}>
      {/* Animasi ringan background (tanpa library tambahan) */}
      <style>{`
        @keyframes floaty {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(0,-18px,0) scale(1.03); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes drift {
          0% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(24px, 10px, 0) rotate(8deg); }
          100% { transform: translate3d(0,0,0) rotate(0deg); }
        }
      `}</style>

      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50" />

      {/* Soft grid noise effect */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Floating blobs */}
      <div
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-60"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(251,191,36,0.75), rgba(251,191,36,0))',
          animation: 'floaty 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full blur-3xl opacity-60"
        style={{
          background: 'radial-gradient(circle at 70% 70%, rgba(251,113,133,0.55), rgba(251,113,133,0))',
          animation: 'floaty 10s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-24 -right-20 h-64 w-64 rounded-full blur-3xl opacity-50"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(56,189,248,0.45), rgba(56,189,248,0))',
          animation: 'drift 12s ease-in-out infinite',
        }}
      />

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm border-0 shadow-xl bg-white/80 backdrop-blur-md animate-fade-in">
          <CardHeader className="text-center pb-2">
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt={brandName} className="mx-auto mb-3 h-16 w-16 rounded-3xl object-contain" />
            ) : (
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
                <Baby className="h-8 w-8 text-primary" />
              </div>
            )}
            <h1 className="font-display text-2xl font-bold text-foreground">{brandName}</h1>
            <p className="text-sm text-muted-foreground">Pantau aktivitas si kecil dengan cinta 💛</p>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="signup">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signup">Daftar</TabsTrigger>
                <TabsTrigger value="login">Masuk</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Lupa password?
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="h-12 text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                    <LogIn className="mr-2 h-5 w-5" /> Masuk
                  </Button>
                </form>

                {showForgot && (
                  <div className="mt-4 p-4 bg-muted rounded-xl space-y-3">
                    <p className="text-sm font-semibold">Reset Password</p>
                    <p className="text-xs text-muted-foreground">Masukkan email Anda, kami akan kirim link reset password.</p>
                    <Input
                      type="email"
                      placeholder="email@contoh.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="h-10 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowForgot(false)} className="flex-1">
                        Batal
                      </Button>
                      <Button size="sm" onClick={handleForgotPassword} disabled={loading} className="flex-1">
                        {loading ? 'Mengirim...' : 'Kirim Link'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/70 backdrop-blur px-2 text-xs text-muted-foreground">
                    atau
                  </span>
                </div>

                <Button variant="outline" className="w-full h-12 text-base" onClick={handleGoogleLogin} disabled={loading}>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Masuk dengan Google
                </Button>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name">Nama</Label>
                    <Input
                      id="signup-name"
                      placeholder="Nama lengkap"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone">No. HP WhatsApp</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      className="h-12 text-base"
                      maxLength={20}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>

                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="Min. 6 karakter"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="h-12 text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showSignupPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showSignupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={v => setRole(v as 'parent' | 'babysitter')}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">👩 Orang Tua</SelectItem>
                        <SelectItem value="babysitter">👩‍🍼 Babysitter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                    <UserPlus className="mr-2 h-5 w-5" /> Daftar
                  </Button>
                </form>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/70 backdrop-blur px-2 text-xs text-muted-foreground">
                    atau
                  </span>
                </div>

                <Button variant="outline" className="w-full h-12 text-base" onClick={handleGoogleLogin} disabled={loading}>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Daftar dengan Google
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
