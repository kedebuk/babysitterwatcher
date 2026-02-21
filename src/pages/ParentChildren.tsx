import { useState } from 'react';
import { useChildren, useCreateChild } from '@/hooks/use-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, BarChart3 } from 'lucide-react';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const ParentChildren = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: children = [], isLoading } = useChildren();
  const createChild = useCreateChild();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newEmoji, setNewEmoji] = useState('👶');

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

      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        {children.map(child => {
          const age = child.dob ? differenceInMonths(new Date(), parseISO(child.dob)) : null;
          return (
            <Card key={child.id} className="border-0 shadow-sm animate-fade-in cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/parent/dashboard')}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-2xl">
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
      </div>
    </div>
  );
};

export default ParentChildren;
