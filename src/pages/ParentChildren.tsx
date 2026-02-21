import { useState } from 'react';
import { useChildren, useCreateChild } from '@/hooks/use-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, BarChart3, UserPlus, Trash2, Mail } from 'lucide-react';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ParentChildren = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: children = [], isLoading } = useChildren();
  const createChild = useCreateChild();

  // Add child dialog
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newEmoji, setNewEmoji] = useState('👶');

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteChildId, setInviteChildId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Get assignments for all children
  const { data: allAssignments = [] } = useQuery({
    queryKey: ['all_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, profiles:babysitter_user_id(name, email)');
      if (error) throw error;
      return data || [];
    },
  });

  // Get pending invites
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['pending_invites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_invites')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const handleAdd = async () => {
    if (!newName.trim() || !user) return;
    try {
      await createChild.mutateAsync({
        name: newName.trim(),
        dob: newDob || undefined,
        notes: newNotes,
        avatar_emoji: newEmoji,
        parent_id: user.id,
      });
      toast({ title: '✅ Berhasil!', description: `${newName} berhasil ditambahkan` });
      setNewName(''); setNewDob(''); setNewNotes(''); setNewEmoji('👶');
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteChildId) return;
    setInviteLoading(true);
    try {
      const email = inviteEmail.trim().toLowerCase();

      // Check if babysitter already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        // Check if has babysitter role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', existingProfile.id)
          .eq('role', 'babysitter')
          .maybeSingle();

        if (!roleData) {
          toast({ title: '⚠️ Bukan babysitter', description: 'Akun ini tidak memiliki role babysitter', variant: 'destructive' });
          setInviteLoading(false);
          return;
        }

        // Check if already assigned
        const { data: existingAssignment } = await supabase
          .from('assignments')
          .select('id')
          .eq('child_id', inviteChildId)
          .eq('babysitter_user_id', existingProfile.id)
          .maybeSingle();

        if (existingAssignment) {
          toast({ title: '⚠️ Sudah ditugaskan', description: `${existingProfile.name} sudah ditugaskan untuk anak ini` });
          setInviteLoading(false);
          return;
        }

        // Create assignment directly
        const { error } = await supabase
          .from('assignments')
          .insert({ child_id: inviteChildId, babysitter_user_id: existingProfile.id });
        if (error) throw error;

        toast({ title: '✅ Berhasil!', description: `${existingProfile.name} berhasil ditugaskan` });
      } else {
        // Babysitter not registered yet - create pending invite
        const { error } = await supabase
          .from('pending_invites')
          .insert({ child_id: inviteChildId, invited_email: email, invited_by: user!.id });

        if (error) {
          if (error.code === '23505') {
            toast({ title: '⚠️ Sudah diundang', description: 'Email ini sudah diundang untuk anak ini' });
          } else {
            throw error;
          }
          setInviteLoading(false);
          return;
        }

        toast({ title: '📩 Undangan tersimpan', description: `${email} akan otomatis ditugaskan saat mendaftar sebagai babysitter` });
      }

      qc.invalidateQueries({ queryKey: ['all_assignments'] });
      qc.invalidateQueries({ queryKey: ['pending_invites'] });
      setInviteEmail('');
      setInviteOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setInviteLoading(false);
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['all_assignments'] });
      toast({ title: 'Dihapus', description: 'Penugasan babysitter dihapus' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleRemovePendingInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase.from('pending_invites').delete().eq('id', inviteId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['pending_invites'] });
      toast({ title: 'Dihapus', description: 'Undangan pending dihapus' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Anak Saya</h1>
            <p className="text-xs opacity-80">{user?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/parent/dashboard')}>
              <BarChart3 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {children.map(child => {
          const age = child.dob ? differenceInMonths(new Date(), parseISO(child.dob)) : null;
          const childAssignments = allAssignments.filter((a: any) => a.child_id === child.id);
          const childPendingInvites = pendingInvites.filter((i: any) => i.child_id === child.id);

          return (
            <Card key={child.id} className="border-0 shadow-sm animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/parent/dashboard')}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-2xl shrink-0">
                    {child.avatar_emoji || '👶'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{child.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {age !== null ? `${age} bulan` : ''}
                      {child.dob ? ` • Lahir ${format(parseISO(child.dob), 'd MMM yyyy', { locale: idLocale })}` : ''}
                    </p>
                    {child.notes && <p className="text-xs text-accent mt-0.5">⚠️ {child.notes}</p>}
                  </div>
                </div>

                {/* Assigned babysitters */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground">👩‍🍼 Babysitter</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary"
                      onClick={(e) => { e.stopPropagation(); setInviteChildId(child.id); setInviteOpen(true); }}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" /> Undang
                    </Button>
                  </div>

                  {childAssignments.length === 0 && childPendingInvites.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Belum ada babysitter ditugaskan</p>
                  )}

                  {childAssignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs">👩‍🍼</div>
                        <div>
                          <p className="text-sm font-medium">{(assignment as any).profiles?.name || 'Babysitter'}</p>
                          <p className="text-xs text-muted-foreground">{(assignment as any).profiles?.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleRemoveAssignment(assignment.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {childPendingInvites.map((invite: any) => (
                    <div key={invite.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-warning/10 flex items-center justify-center text-xs">
                          <Mail className="h-3.5 w-3.5 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{invite.invited_email}</p>
                          <p className="text-xs text-warning">⏳ Menunggu pendaftaran</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleRemovePendingInvite(invite.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full h-14 border-dashed text-muted-foreground">
              <Plus className="mr-2 h-5 w-5" /> Tambah Anak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Anak Baru</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Emoji Avatar</Label>
                <div className="flex gap-2">
                  {['👶', '🧒', '👧', '👦', '🍼'].map(e => (
                    <button key={e} onClick={() => setNewEmoji(e)} className={`text-2xl p-2 rounded-lg ${newEmoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nama</Label>
                <Input placeholder="Nama anak" value={newName} onChange={e => setNewName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal Lahir</Label>
                <Input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Catatan (opsional)</Label>
                <Input placeholder="Alergi, kondisi khusus, dll" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="h-11" />
              </div>
              <Button className="w-full h-12 font-semibold" onClick={handleAdd} disabled={!newName.trim()}>
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invite babysitter dialog */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Undang Babysitter</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Masukkan email babysitter. Jika sudah terdaftar, akan langsung ditugaskan. Jika belum, undangan akan tersimpan dan otomatis aktif saat mendaftar.
              </p>
              <div className="space-y-1.5">
                <Label>Email Babysitter</Label>
                <Input
                  type="email"
                  placeholder="babysitter@email.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button className="w-full h-12 font-semibold" onClick={handleInvite} disabled={!inviteEmail.trim() || inviteLoading}>
                <UserPlus className="mr-2 h-5 w-5" />
                {inviteLoading ? 'Memproses...' : 'Undang Babysitter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ParentChildren;
