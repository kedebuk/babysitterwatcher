import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Shield, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AdminSetup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Check if any admin already exists
  useEffect(() => {
    const checkAdmins = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      setHasAdmin(data !== null && data.length > 0);
    };
    checkAdmins();
  }, []);

  // If already logged in as admin, redirect
  if (!authLoading && user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If admin already exists, block access
  if (hasAdmin === true) {
    return <Navigate to="/login" replace />;
  }

  // Still checking
  if (hasAdmin === null) {
    return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Memuat...</div></div>;
  }

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password minimal 6 karakter', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: 'admin' },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      toast({ title: '✅ Admin dibuat!', description: 'Silakan login di halaman login biasa' });
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-fade-in border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive">
            <Shield className="h-8 w-8 text-destructive-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Admin Setup</h1>
          <p className="text-sm text-muted-foreground">Daftarkan akun admin pertama</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegisterAdmin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Nama</Label>
              <Input id="admin-name" placeholder="Nama admin" value={name} onChange={e => setName(e.target.value)} required className="h-12 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" type="email" placeholder="admin@contoh.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 text-base" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" placeholder="Min. 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 text-base" />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold bg-destructive hover:bg-destructive/90" disabled={loading}>
              <UserPlus className="mr-2 h-5 w-5" /> Daftarkan Admin
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/login')}>
              ← Kembali ke Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
