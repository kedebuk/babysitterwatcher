import { useState, useRef } from 'react';
import { useChildren, useCreateChild } from '@/hooks/use-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, BarChart3, UserPlus, Trash2, Mail, Eye, Pencil, Camera } from 'lucide-react';
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
  const [inviteRole, setInviteRole] = useState<'babysitter' | 'parent'>('babysitter');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Edit child dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editChild, setEditChild] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editEmoji, setEditEmoji] = useState('👶');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

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

  // Get child viewers
  const { data: allViewers = [] } = useQuery({
    queryKey: ['child_viewers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('child_viewers')
        .select('*, profiles:viewer_user_id(name, email)');
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

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        // Check if already assigned/connected
        if (inviteRole === 'babysitter') {
          const { data: existing } = await supabase
            .from('assignments')
            .select('id')
            .eq('child_id', inviteChildId)
            .eq('babysitter_user_id', existingProfile.id)
            .maybeSingle();
          if (existing) {
            toast({ title: '⚠️ Sudah ditugaskan', description: `${existingProfile.name} sudah ditugaskan untuk anak ini` });
            setInviteLoading(false);
            return;
          }
        } else {
          const { data: existing } = await supabase
            .from('child_viewers')
            .select('id')
            .eq('child_id', inviteChildId)
            .eq('viewer_user_id', existingProfile.id)
            .maybeSingle();
          if (existing) {
            toast({ title: '⚠️ Sudah terhubung', description: `${existingProfile.name} sudah bisa melihat data anak ini` });
            setInviteLoading(false);
            return;
          }
        }

        // Save as pending invite with user ID (needs confirmation)
        const { error } = await supabase
          .from('pending_invites')
          .insert({ child_id: inviteChildId, invited_email: email, invited_by: user!.id, invite_role: inviteRole, invited_user_id: existingProfile.id } as any);

        if (error) {
          if (error.code === '23505') {
            toast({ title: '⚠️ Sudah diundang', description: 'Email ini sudah memiliki undangan pending' });
          } else throw error;
          setInviteLoading(false);
          return;
        }

        // Send in-app notification to the invited user
        await supabase.from('notifications').insert({
          user_id: existingProfile.id,
          message: `${user!.name} mengundang Anda sebagai ${inviteRole === 'parent' ? 'keluarga' : 'babysitter'} untuk anaknya. Buka dashboard untuk konfirmasi.`,
        });

        toast({ title: '📩 Undangan terkirim!', description: `${existingProfile.name} akan menerima notifikasi untuk konfirmasi` });
      } else {
        // User doesn't exist yet - save pending invite (auto-resolve on signup)
        const { error } = await supabase
          .from('pending_invites')
          .insert({ child_id: inviteChildId, invited_email: email, invited_by: user!.id, invite_role: inviteRole } as any);

        if (error) {
          if (error.code === '23505') {
            toast({ title: '⚠️ Sudah diundang', description: 'Email ini sudah diundang untuk anak ini' });
          } else throw error;
          setInviteLoading(false);
          return;
        }

        toast({ title: '📩 Undangan tersimpan', description: `${email} akan otomatis terhubung saat mendaftar` });
      }

      qc.invalidateQueries({ queryKey: ['all_assignments'] });
      qc.invalidateQueries({ queryKey: ['pending_invites'] });
      qc.invalidateQueries({ queryKey: ['child_viewers'] });
      setInviteEmail('');
      setInviteRole('babysitter');
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

  const handleRemoveViewer = async (viewerId: string) => {
    try {
      const { error } = await supabase.from('child_viewers').delete().eq('id', viewerId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['child_viewers'] });
      toast({ title: 'Dihapus', description: 'Akses keluarga dihapus' });
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

  const openEditDialog = (child: any) => {
    setEditChild(child);
    setEditName(child.name);
    setEditDob(child.dob || '');
    setEditNotes(child.notes || '');
    setEditEmoji(child.avatar_emoji || '👶');
    setEditPhotoPreview((child as any).photo_url || null);
    setEditPhotoFile(null);
    setEditOpen(true);
  };

  const handleEditPhotoSelect = (file: File) => {
    if (editPhotoPreview && !editPhotoPreview.startsWith('http')) URL.revokeObjectURL(editPhotoPreview);
    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
  };

  const handleEditSave = async () => {
    if (!editChild || !editName.trim() || !user) return;
    setEditSaving(true);
    try {
      let photoUrl = (editChild as any).photo_url;
      if (editPhotoFile) {
        const ext = editPhotoFile.name.split('.').pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('child-photos').upload(path, editPhotoFile);
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from('child-photos').getPublicUrl(path);
        photoUrl = data.publicUrl;
      }
      const { error } = await supabase.from('children').update({
        name: editName.trim(),
        dob: editDob || null,
        notes: editNotes,
        avatar_emoji: editEmoji,
        photo_url: photoUrl,
      } as any).eq('id', editChild.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['children'] });
      toast({ title: '✅ Berhasil!', description: 'Data anak berhasil diperbarui' });
      setEditOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setEditSaving(false);
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
          const childViewers = allViewers.filter((v: any) => v.child_id === child.id);
          const childPendingInvites = pendingInvites.filter((i: any) => i.child_id === child.id);
          const totalConnected = childAssignments.length + childViewers.length + childPendingInvites.length;

          return (
            <Card key={child.id} className="border-0 shadow-sm animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0 cursor-pointer" onClick={() => navigate('/parent/dashboard')}>
                    {(child as any).photo_url ? (
                      <img src={(child as any).photo_url} alt={child.name} className="h-14 w-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-2xl">
                        {child.avatar_emoji || '👶'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => navigate('/parent/dashboard')}>
                    <h3 className="font-bold text-base">{child.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {age !== null ? `${age} bulan` : ''}
                      {child.dob ? ` • Lahir ${format(parseISO(child.dob), 'd MMM yyyy', { locale: idLocale })}` : ''}
                    </p>
                    {child.notes && <p className="text-xs text-accent mt-0.5">⚠️ {child.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground shrink-0" onClick={(e) => { e.stopPropagation(); openEditDialog(child); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                {/* Connected people section */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      👥 Terhubung ({totalConnected} orang)
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary"
                      onClick={(e) => { e.stopPropagation(); setInviteChildId(child.id); setInviteOpen(true); }}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" /> Undang
                    </Button>
                  </div>

                  {totalConnected === 0 && (
                    <p className="text-xs text-muted-foreground italic">Belum ada yang terhubung</p>
                  )}

                  {/* Babysitters */}
                  {childAssignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs">👩‍🍼</div>
                        <div>
                          <p className="text-sm font-medium">{assignment.profiles?.name || 'Babysitter'}</p>
                          <p className="text-xs text-muted-foreground">{assignment.profiles?.email} • Babysitter</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleRemoveAssignment(assignment.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* Viewers (parent tambahan) */}
                  {childViewers.map((viewer: any) => (
                    <div key={viewer.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center text-xs">
                          <Eye className="h-3.5 w-3.5 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{viewer.profiles?.name || 'Keluarga'}</p>
                          <p className="text-xs text-muted-foreground">{viewer.profiles?.email} • Keluarga</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleRemoveViewer(viewer.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* Pending invites */}
                  {childPendingInvites.map((invite: any) => (
                    <div key={invite.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-warning/10 flex items-center justify-center text-xs">
                          <Mail className="h-3.5 w-3.5 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{invite.invited_email}</p>
                          <p className="text-xs text-warning">⏳ Menunggu pendaftaran • {invite.invite_role === 'parent' ? 'Keluarga' : 'Babysitter'}</p>
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

        {/* Invite dialog with role selection */}
        <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) { setInviteRole('babysitter'); setInviteEmail(''); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Undang Orang</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Peran</Label>
                <RadioGroup value={inviteRole} onValueChange={(v) => setInviteRole(v as 'babysitter' | 'parent')} className="flex gap-3">
                  <div className="flex items-center space-x-2 flex-1 border rounded-lg p-3 cursor-pointer" onClick={() => setInviteRole('babysitter')}>
                    <RadioGroupItem value="babysitter" id="role-babysitter" />
                    <Label htmlFor="role-babysitter" className="cursor-pointer">
                      <span className="font-semibold">👩‍🍼 Babysitter</span>
                      <p className="text-xs text-muted-foreground">Bisa input log harian</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 border rounded-lg p-3 cursor-pointer" onClick={() => setInviteRole('parent')}>
                    <RadioGroupItem value="parent" id="role-parent" />
                    <Label htmlFor="role-parent" className="cursor-pointer">
                      <span className="font-semibold">👨‍👩‍👧 Keluarga</span>
                      <p className="text-xs text-muted-foreground">Bisa lihat dashboard</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder={inviteRole === 'babysitter' ? 'babysitter@email.com' : 'keluarga@email.com'}
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {inviteRole === 'babysitter'
                  ? 'Jika sudah terdaftar sebagai babysitter, akan langsung ditugaskan. Jika belum, undangan tersimpan otomatis.'
                  : 'Jika sudah terdaftar, langsung bisa melihat dashboard anak. Jika belum, undangan tersimpan otomatis.'}
              </p>
              <Button className="w-full h-12 font-semibold" onClick={handleInvite} disabled={!inviteEmail.trim() || inviteLoading}>
                <UserPlus className="mr-2 h-5 w-5" />
                {inviteLoading ? 'Memproses...' : `Undang ${inviteRole === 'babysitter' ? 'Babysitter' : 'Keluarga'}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit child dialog */}
        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditPhotoFile(null); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Data Anak</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative cursor-pointer" onClick={() => editFileRef.current?.click()}>
                  {editPhotoPreview ? (
                    <img src={editPhotoPreview} alt="Foto anak" className="h-20 w-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-3xl">
                      {editEmoji}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center">
                    <Camera className="h-3.5 w-3.5" />
                  </div>
                </div>
                <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleEditPhotoSelect(e.target.files[0]); e.target.value = ''; }} />
                <div className="flex-1 space-y-1.5">
                  <Label>Emoji Avatar</Label>
                  <div className="flex gap-2">
                    {['👶', '🧒', '👧', '👦', '🍼'].map(e => (
                      <button key={e} onClick={() => setEditEmoji(e)} className={`text-2xl p-2 rounded-lg ${editEmoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted'}`}>{e}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nama</Label>
                <Input placeholder="Nama anak" value={editName} onChange={e => setEditName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal Lahir</Label>
                <Input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Catatan (opsional)</Label>
                <Input placeholder="Alergi, kondisi khusus, dll" value={editNotes} onChange={e => setEditNotes(e.target.value)} className="h-11" />
              </div>
              <Button className="w-full h-12 font-semibold" onClick={handleEditSave} disabled={!editName.trim() || editSaving}>
                {editSaving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ParentChildren;
