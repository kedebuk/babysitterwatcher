import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Baby, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      // Role-based redirect handled by App
      const user = email === 'mama@example.com' ? 'parent' : 'babysitter';
      navigate(user === 'parent' ? '/parent/dashboard' : '/babysitter/today');
    } else {
      toast({
        title: 'Login gagal',
        description: 'Email atau password salah. Coba: mama@example.com atau sitter@example.com',
        variant: 'destructive',
      });
    }
  };

  const quickLogin = async (role: 'parent' | 'babysitter') => {
    const email = role === 'parent' ? 'mama@example.com' : 'sitter@example.com';
    setEmail(email);
    setLoading(true);
    const success = await login(email, '');
    setLoading(false);
    if (success) {
      navigate(role === 'parent' ? '/parent/dashboard' : '/babysitter/today');
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
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              <LogIn className="mr-2 h-5 w-5" />
              Masuk
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Demo Login</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12" onClick={() => quickLogin('parent')}>
              👩 Orang Tua
            </Button>
            <Button variant="outline" className="h-12" onClick={() => quickLogin('babysitter')}>
              👩‍🍼 Babysitter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
