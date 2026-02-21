import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Baby, LogOut } from 'lucide-react';

const ChooseRole = () => {
  const { user, loading, setActiveRole, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Memuat...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return <Navigate to={user.role === 'parent' ? '/parent/dashboard' : '/babysitter/today'} replace />;
  }

  const handleChoose = (role: 'admin' | 'parent') => {
    setActiveRole(role);
    navigate(role === 'admin' ? '/admin/dashboard' : '/parent/dashboard', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-fade-in border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Baby className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Halo, {user.name} 👋</h1>
          <p className="text-sm text-muted-foreground">Mau masuk sebagai apa?</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-16 justify-start gap-4 text-left"
            onClick={() => handleChoose('parent')}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
              <Baby className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">Orang Tua</p>
              <p className="text-xs text-muted-foreground">Lihat dashboard & kelola anak</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-16 justify-start gap-4 text-left"
            onClick={() => handleChoose('admin')}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive">
              <Shield className="h-5 w-5 text-destructive-foreground" />
            </div>
            <div>
              <p className="font-semibold">Administrator</p>
              <p className="text-xs text-muted-foreground">Kelola semua pengguna & data</p>
            </div>
          </Button>

          <Button variant="ghost" size="sm" className="w-full text-muted-foreground mt-2" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Keluar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChooseRole;
