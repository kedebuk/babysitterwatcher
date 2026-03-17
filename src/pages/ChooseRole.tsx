import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

// Custom aesthetic SVG icons for each role
const AdminIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7v6c0 5.25 3.75 10.13 9 11.25C17.25 23.13 21 18.25 21 13V7l-9-5z" fill="currentColor" opacity="0.25"/>
    <path d="M12 2L3 7v6c0 5.25 3.75 10.13 9 11.25C17.25 23.13 21 18.25 21 13V7l-9-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ParentIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" opacity="0.25"/>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    <circle cx="12" cy="10" r="2" fill="currentColor" opacity="0.6"/>
    <path d="M9 14.5c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const BabysitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="6.5" r="3" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" fill="currentColor" opacity="0.15"/>
    <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <circle cx="18" cy="10.5" r="2.2" fill="currentColor" opacity="0.35" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M14.5 20c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const FamilyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M3 10.5L12 4l9 6.5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" fill="currentColor" opacity="0.2"/>
    <path d="M3 10.5L12 4l9 6.5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    <circle cx="12" cy="13" r="2" fill="currentColor" opacity="0.5"/>
    <path d="M9.5 17.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ROLE_CONFIG = {
  parent: {
    label: 'Orang Tua',
    description: 'Lihat dashboard & kelola anak',
    icon: ParentIcon,
    gradient: 'from-orange-400 to-amber-500',
    redirect: '/parent/dashboard',
  },
  babysitter: {
    label: 'Babysitter',
    description: 'Input harian & pantau anak',
    icon: BabysitterIcon,
    gradient: 'from-pink-300 to-rose-400',
    redirect: '/babysitter/today',
  },
  viewer: {
    label: 'Keluarga',
    description: 'Lihat aktivitas anak (view only)',
    icon: FamilyIcon,
    gradient: 'from-rose-400 to-pink-500',
    redirect: '/viewer/dashboard',
  },
  admin: {
    label: 'Administrator',
    description: 'Kelola semua pengguna & data',
    icon: AdminIcon,
    gradient: 'from-red-400 to-rose-500',
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

  const handleChoose = (role: 'parent' | 'babysitter' | 'admin' | 'viewer') => {
    setActiveRole(role);
    navigate(ROLE_CONFIG[role].redirect, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-fade-in border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 shadow-md">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 20c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M12 12c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8z" fill="currentColor" opacity="0.15"/>
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold">Halo, {user.name} 👋</h1>
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
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} shadow-sm`}>
                  <Icon className="h-5 w-5 text-white" />
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
