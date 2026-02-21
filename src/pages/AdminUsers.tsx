import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut, Shield } from 'lucide-react';

const AdminUsers = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin_all_profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['admin_all_roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('*');
      return data || [];
    },
  });

  const getUserRole = (userId: string) => {
    const r = roles.find((r: any) => r.user_id === userId);
    return r?.role || 'unknown';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'parent': return '👩 Parent';
      case 'babysitter': return '👩‍🍼 Babysitter';
      case 'admin': return '🛡️ Admin';
      default: return '❓ Unknown';
    }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-destructive px-4 py-3 text-destructive-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-destructive-foreground hover:bg-destructive-foreground/20" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2"><Shield className="h-5 w-5" /> Daftar User</h1>
              <p className="text-xs opacity-80">{profiles.length} user terdaftar</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive-foreground hover:bg-destructive-foreground/20" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2 max-w-3xl mx-auto">
        {profiles.map((profile: any) => {
          const role = getUserRole(profile.id);
          return (
            <Card key={profile.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary">{getRoleBadge(role)}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminUsers;
