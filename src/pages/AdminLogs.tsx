import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, LogOut, Shield, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const ACTION_LABELS: Record<string, string> = {
  create_event: '📝 Buat Event',
  login: '🔑 Login',
  signup: '👤 Daftar',
};

const PAGE_SIZE = 50;

const AdminLogs = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin_activity_logs', limit],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    },
  });

  const filteredLogs = searchQuery.trim()
    ? logs.filter((log: any) => {
        const q = searchQuery.toLowerCase();
        return (log.user_email?.toLowerCase().includes(q) || log.action?.toLowerCase().includes(q) || log.detail?.toLowerCase().includes(q));
      })
    : logs;

  const hasMore = logs.length >= limit;

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
              <h1 className="text-lg font-bold flex items-center gap-2"><Shield className="h-5 w-5" /> Activity Logs</h1>
              <p className="text-xs opacity-80">{filteredLogs.length} log{searchQuery ? ' (filtered)' : ''}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive-foreground hover:bg-destructive-foreground/20" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 max-w-3xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari email, aksi, atau detail..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {filteredLogs.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">
            {searchQuery ? 'Tidak ada log yang cocok' : 'Belum ada activity log'}
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log: any) => (
              <Card key={log.id} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{ACTION_LABELS[log.action] || log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.user_email || 'System'}</p>
                      {log.detail && <p className="text-xs text-muted-foreground mt-0.5">{log.detail}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(parseISO(log.created_at), 'd MMM HH:mm', { locale: idLocale })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {hasMore && !searchQuery && (
              <Button variant="outline" className="w-full" onClick={() => setLimit(prev => prev + PAGE_SIZE)}>
                Muat lebih banyak...
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
