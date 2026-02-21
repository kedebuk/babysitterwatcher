import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

const PendingInvites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: invites = [] } = useQuery({
    queryKey: ['my_pending_invites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_invites')
        .select('*, children:child_id(name, avatar_emoji, parent_id)')
        .eq('invited_user_id', user!.id)
        .eq('status', 'pending');
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch parent names separately
      const parentIds = [...new Set(data.map((i: any) => i.children?.parent_id).filter(Boolean))];
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', parentIds);
      const profileMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p.name; });

      return data.map((i: any) => ({
        ...i,
        parent_name: i.children?.parent_id ? profileMap[i.children.parent_id] : null,
      }));
    },
    enabled: !!user?.id,
  });

  const handleAccept = async (invite: any) => {
    setProcessing(invite.id);
    try {
      if (invite.invite_role === 'parent') {
        const { error } = await supabase
          .from('child_viewers')
          .insert({ child_id: invite.child_id, viewer_user_id: user!.id });
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('assignments')
          .insert({ child_id: invite.child_id, babysitter_user_id: user!.id });
        if (error && error.code !== '23505') throw error;
      }

      await supabase
        .from('pending_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      qc.invalidateQueries({ queryKey: ['my_pending_invites'] });
      qc.invalidateQueries({ queryKey: ['assigned_children'] });
      qc.invalidateQueries({ queryKey: ['children'] });
      toast({ title: '✅ Diterima!', description: `Anda sekarang terhubung dengan ${invite.children?.name}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setProcessing(null);
  };

  const handleReject = async (invite: any) => {
    setProcessing(invite.id);
    try {
      await supabase
        .from('pending_invites')
        .update({ status: 'rejected' })
        .eq('id', invite.id);

      qc.invalidateQueries({ queryKey: ['my_pending_invites'] });
      toast({ title: 'Ditolak', description: 'Undangan telah ditolak' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setProcessing(null);
  };

  if (invites.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-bold text-muted-foreground">📩 Undangan Masuk</h2>
      {invites.map((invite: any) => (
        <Card key={invite.id} className="border-0 shadow-sm border-l-4 border-l-primary animate-fade-in">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">
                  {invite.children?.avatar_emoji || '👶'}
                </div>
                <div>
                  <p className="text-sm font-semibold">{invite.children?.name || 'Anak'}</p>
                  <p className="text-xs text-muted-foreground">
                    Dari: {invite.parent_name || 'Parent'} • 
                    Peran: {invite.invite_role === 'parent' ? '👨‍👩‍👧 Keluarga' : '👩‍🍼 Babysitter'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-destructive border-destructive/30"
                  onClick={() => handleReject(invite)}
                  disabled={processing === invite.id}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => handleAccept(invite)}
                  disabled={processing === invite.id}
                >
                  <Check className="h-4 w-4 mr-1" /> Terima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PendingInvites;
