import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Baby, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable/index';
import { Separator } from '@/components/ui/separator';
import { useMetaPixel } from '@/hooks/use-meta-pixel';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'parent' | 'babysitter'>('parent');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const { user, loading: authLoading, login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useMetaPixel();

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
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    if (result?.error) {
      toast({ title: 'Google login gagal', description: String(result.error), variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-fade-in border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <Baby className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Eleanor Tracker</h1>
          <p className="text-sm text-muted-foreground">Pantau aktivitas si kecil dengan cinta 💛</p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signup">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signup">Daftar</TabsTrigger>
              <TabsTrigger value="login">Masuk</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {/* Login content tetap sama seperti sebelumnya */}
            </TabsContent>

            <TabsContent value="signup">
              {/* Signup content tetap sama seperti sebelumnya */}
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
