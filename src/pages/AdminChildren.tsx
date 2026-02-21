import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut, Shield, ChevronRight } from 'lucide-react';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const AdminChildren = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['admin_all_children'],
    queryFn: async () => {
      const { data } = await supabase.from('children').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin_all_profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, name, email');
      return data || [];
    },
  });

  const getParentName = (parentId: string) => {
    const p = profiles.find((p: any) => p.id === parentId);
    return p?.name || p?.email || 'Unknown';
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
              <h1 className="text-lg font-bold flex items-center gap-2"><Shield className="h-5 w-5" /> Semua Anak</h1>
              <p className="text-xs opacity-80">{children.length} anak terdaftar</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive-foreground hover:bg-destructive-foreground/20" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2 max-w-3xl mx-auto">
        {children.map((child: any) => {
          const age = child.dob ? differenceInMonths(new Date(), parseISO(child.dob)) : null;
          return (
            <Card key={child.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/admin/children/${child.id}`)}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-xl shrink-0">
                  {child.avatar_emoji || '👶'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{child.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Parent: {getParentName(child.parent_id)}
                    {age !== null ? ` • ${age} bulan` : ''}
                  </p>
                  {child.notes && <p className="text-xs text-accent mt-0.5 truncate">⚠️ {child.notes}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminChildren;
