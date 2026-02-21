import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Baby, LogIn, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'babysitter'>('parent');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (!authLoading && user) {
    const dest = user.role === 'admin' ? '/admin/dashboard' : user.role === 'parent' ? '/parent/dashboard' : '/babysitter/today';
    return <Navigate to={dest} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      // Navigation handled by auth state change
    } else {
      toast({ title: 'Login gagal', description: result.error, variant: 'destructive' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password minimal 6 karakter', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const result = await signup(email, password, name, role);
    setLoading(false);
    if (result.success) {
      toast({ title: '✅ Akun dibuat!', description: 'Silakan login dengan akun baru Anda' });
    } else {
      toast({ title: 'Daftar gagal', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-fade-in border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Baby className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Child Tracker</h1>
          <p className="text-sm text-muted-foreground">Pantau aktivitas si kecil</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="email@contoh.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 text-base" />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                  <LogIn className="mr-2 h-5 w-5" /> Masuk
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Nama</Label>
                  <Input id="signup-name" placeholder="Nama lengkap" value={name} onChange={e => setName(e.target.value)} required className="h-12 text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="email@contoh.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="Min. 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 text-base" />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
