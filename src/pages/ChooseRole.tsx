import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Baby, LogOut, UserCheck } from 'lucide-react';

const ROLE_CONFIG = {
  parent: {
    label: 'Orang Tua',
    description: 'Lihat dashboard & kelola anak',
    icon: Baby,
    color: 'bg-primary',
    redirect: '/parent/dashboard',
  },
  babysitter: {
    label: 'Babysitter',
    description: 'Input harian & pantau anak',
    icon: UserCheck,
    color: 'bg-secondary',
    redirect: '/babysitter/today',
  },
  admin: {
    label: 'Administrator',
    description: 'Kelola semua pengguna & data',
    icon: Shield,
    color: 'bg-destructive',
    redirect: '/admin/dashboard',
  },
} as const;

const ChooseRole = () => {
  const { user, loading, setActiveRole, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Memuat...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  const roles = user.roles || [];
  
  // If only one role, set it and redirect
  if (roles.length <= 1) {
    const singleRole = roles[0] || user.role;
    if (singleRole) {
      return <Navigate to={ROLE_CONFIG[singleRole]?.redirect || '/login'} replace />;
    }
    return <Navigate to="/select-role" replace />;
  }

  const handleChoose = (role: 'parent' | 'babysitter' | 'admin') => {
    setActiveRole(role);
    navigate(ROLE_CONFIG[role].redirect, { replace: true });
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
          {roles.map(role => {
            const config = ROLE_CONFIG[role];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <Button
                key={role}
                variant="outline"
                className="w-full h-16 justify-start gap-4 text-left"
                onClick={() => handleChoose(role)}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.color}`}>
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </Button>
            );
          })}

          <Button variant="ghost" size="sm" className="w-full text-muted-foreground mt-2" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Keluar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChooseRole;
