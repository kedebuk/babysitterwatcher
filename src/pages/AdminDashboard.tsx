import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Baby, Calendar, ScrollText, Shield, RefreshCw, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: totalUsers = 0 } = useQuery({
    queryKey: ['admin_total_users'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: totalChildren = 0 } = useQuery({
    queryKey: ['admin_total_children'],
    queryFn: async () => {
      const { count } = await supabase.from('children').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: todayEvents = 0 } = useQuery({
    queryKey: ['admin_today_events'],
    queryFn: async () => {
      const { data: logs } = await supabase.from('daily_logs').select('id').eq('log_date', today);
      if (!logs || logs.length === 0) return 0;
      const { count } = await supabase.from('events').select('*', { count: 'exact', head: true }).in('daily_log_id', logs.map(l => l.id));
      return count || 0;
    },
  });

  const { data: totalRoles = [] } = useQuery({
    queryKey: ['admin_role_stats'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('role');
      return data || [];
    },
  });

  const parentCount = totalRoles.filter(r => r.role === 'parent').length;
  const babysitterCount = totalRoles.filter(r => r.role === 'babysitter').length;
  const adminCount = totalRoles.filter(r => r.role === 'admin').length;

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-destructive px-4 py-3 text-destructive-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2"><Shield className="h-5 w-5" /> Admin Panel</h1>
            <p className="text-xs opacity-80">Halo, {user?.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive-foreground hover:bg-destructive-foreground/20">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {(user?.roles?.length ?? 0) > 1 && (
                <>
                  <DropdownMenuItem onClick={() => { 
                    sessionStorage.removeItem('activeRole'); 
                    navigate('/choose-role'); 
                  }}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Ganti Role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/users')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Total User</span>
              </div>
              <p className="text-3xl font-bold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">👩 {parentCount} parent • 👩‍🍼 {babysitterCount} babysitter • 🛡️ {adminCount} admin</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/children')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Baby className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Total Anak</span>
              </div>
              <p className="text-3xl font-bold">{totalChildren}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Event Hari Ini</span>
              </div>
              <p className="text-3xl font-bold">{todayEvents}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/logs')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ScrollText className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">Activity Logs</span>
              </div>
              <p className="text-sm font-semibold text-primary">Lihat →</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/settings')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Pengaturan</p>
                <p className="text-xs text-muted-foreground">WhatsApp admin & lainnya</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
