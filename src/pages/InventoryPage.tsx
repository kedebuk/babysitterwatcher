import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/use-data';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BottomNav } from '@/components/BottomNav';
import { Plus, Minus, Package, TrendingDown, AlertTriangle, ArrowLeft, Camera, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EMOJI_OPTIONS = ['📦', '🍼', '🧷', '💊', '🧴', '🧻', '🧸', '👶', '🍪', '🥛'];
const UNIT_OPTIONS = ['pcs', 'ml', 'sachet', 'botol', 'pack', 'dosis', 'lembar'];

async function uploadInventoryPhoto(file: File, childId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${childId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('inventory-photos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('inventory-photos').getPublicUrl(path);
  return data.publicUrl;
}

function useInventoryItems(childId: string) {
  return useQuery({
    queryKey: ['inventory_items', childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('child_id', childId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!childId,
  });
}

function useInventoryUsage(childId: string, days = 14) {
  return useQuery({
    queryKey: ['inventory_usage', childId, days],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('inventory_usage')
        .select('*')
        .eq('child_id', childId)
        .gte('usage_date', startDate)
        .order('usage_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!childId,
  });
}

function getEstimatedDaysLeft(currentStock: number, usageHistory: any[], itemId: string): number | null {
  const itemUsage = usageHistory.filter(u => u.item_id === itemId);
  if (itemUsage.length === 0 || currentStock <= 0) return null;
  
  const dates = [...new Set(itemUsage.map(u => u.usage_date))];
  if (dates.length < 2) {
    const totalQty = itemUsage.reduce((s, u) => s + Number(u.quantity), 0);
    return totalQty > 0 ? Math.floor(currentStock / totalQty) : null;
  }
  
  const totalQty = itemUsage.reduce((s, u) => s + Number(u.quantity), 0);
  const daySpan = differenceInDays(new Date(dates[0]), new Date(dates[dates.length - 1])) || 1;
  const avgPerDay = totalQty / daySpan;
  return avgPerDay > 0 ? Math.floor(currentStock / avgPerDay) : null;
}

const InventoryPage = () => {
  const { user } = useAuth();
  const { data: children = [] } = useChildren();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const effectiveRole = user?.roles && user.roles.length > 1
    ? (sessionStorage.getItem('activeRole') as 'parent' | 'babysitter' | null) || user.role
    : user?.role;

  const [selectedChild, setSelectedChild] = useState('');
  const activeChildId = selectedChild || children[0]?.id || '';
  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', emoji: '📦', unit: 'pcs', current_stock: '', low_stock_threshold: '5' });
  const [newItemPhoto, setNewItemPhoto] = useState<File | null>(null);
  const [newItemPhotoPreview, setNewItemPhotoPreview] = useState<string | null>(null);
  const newItemFileRef = useRef<HTMLInputElement>(null);
  const [useQty, setUseQty] = useState<Record<string, string>>({});
  const [editPhotoItemId, setEditPhotoItemId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState(false);

  const { data: items = [], isLoading } = useInventoryItems(activeChildId);
  const { data: usageHistory = [] } = useInventoryUsage(activeChildId);

  // For babysitter: get assigned children
  const { data: assignedChildren = [] } = useQuery({
    queryKey: ['assigned_children_inv', user?.id],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from('assignments')
        .select('child_id')
        .eq('babysitter_user_id', user!.id);
      if (!assignments?.length) return [];
      const childIds = assignments.map(a => a.child_id);
      const { data } = await supabase
        .from('children')
        .select('*')
        .in('id', childIds)
        .order('created_at');
      return data || [];
    },
    enabled: !!user && effectiveRole === 'babysitter',
  });

  const childList = effectiveRole === 'babysitter' ? assignedChildren : children;
  const activeChild = childList.find((c: any) => c.id === activeChildId);

  const createItem = useMutation({
    mutationFn: async (item: typeof newItem) => {
      let photo_url: string | null = null;
      if (newItemPhoto) {
        photo_url = await uploadInventoryPhoto(newItemPhoto, activeChildId);
      }
      const { data, error } = await supabase.from('inventory_items').insert({
        child_id: activeChildId,
        name: item.name,
        emoji: item.emoji,
        unit: item.unit,
        current_stock: Number(item.current_stock) || 0,
        low_stock_threshold: Number(item.low_stock_threshold) || 5,
        created_by: user!.id,
        photo_url,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_items', activeChildId] });
      setAddOpen(false);
      setNewItem({ name: '', emoji: '📦', unit: 'pcs', current_stock: '', low_stock_threshold: '5' });
      setNewItemPhoto(null);
      setNewItemPhotoPreview(null);
      toast({ title: 'Item ditambahkan!' });
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const updateItemPhoto = useMutation({
    mutationFn: async ({ itemId, file }: { itemId: string; file: File }) => {
      const photo_url = await uploadInventoryPhoto(file, activeChildId);
      const { error } = await supabase.from('inventory_items').update({ photo_url }).eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_items', activeChildId] });
      setEditPhotoItemId(null);
      setEditingPhoto(false);
      toast({ title: 'Foto diperbarui!' });
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const recordUsage = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { error } = await supabase.from('inventory_usage').insert({
        item_id: itemId,
        child_id: activeChildId,
        quantity,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_items', activeChildId] });
      qc.invalidateQueries({ queryKey: ['inventory_usage', activeChildId] });
      setUseQty({});
      toast({ title: 'Pemakaian dicatat!' });
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const restockItem = useMutation({
    mutationFn: async ({ itemId, quantity, notes }: { itemId: string; quantity: number; notes?: string }) => {
      const { error } = await supabase.from('inventory_items')
        .update({ current_stock: quantity, notes: notes || null })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_items', activeChildId] });
      toast({ title: 'Stok diperbarui!' });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory_items', activeChildId] });
      toast({ title: 'Item dihapus' });
    },
  });

  // Usage chart data (last 7 days)
  const chartData = (() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      return { date: d, label: format(subDays(new Date(), 6 - i), 'dd/MM') };
    });
    return last7.map(day => {
      const dayUsage = usageHistory.filter(u => u.usage_date === day.date);
      const grouped: Record<string, number> = {};
      dayUsage.forEach(u => {
        const item = items.find(i => i.id === u.item_id);
        const name = item?.emoji || '📦';
        grouped[name] = (grouped[name] || 0) + Number(u.quantity);
      });
      return { date: day.label, total: dayUsage.reduce((s, u) => s + Number(u.quantity), 0), ...grouped };
    });
  })();

  const lowStockItems = items.filter(i => Number(i.current_stock) <= Number(i.low_stock_threshold));

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5" /> Stok Kebutuhan
            </h1>
            <p className="text-xs opacity-80">{activeChild?.name || 'Pilih anak'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">
        {/* Child selector */}
        {childList.length > 1 && (
          <Select value={activeChildId} onValueChange={setSelectedChild}>
            <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="Pilih anak" /></SelectTrigger>
            <SelectContent>
              {childList.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.avatar_emoji || '👶'} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {!activeChildId ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">Pilih anak terlebih dahulu</CardContent></Card>
        ) : (
          <Tabs defaultValue="items">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="items">📦 Stok Item</TabsTrigger>
              <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            </TabsList>

            {/* TAB: Items */}
            <TabsContent value="items" className="space-y-3 mt-3">
              {/* Low stock alert */}
              {lowStockItems.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-destructive font-medium text-sm mb-1">
                      <AlertTriangle className="h-4 w-4" /> Stok Menipis!
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {lowStockItems.map(i => (
                        <Badge key={i.id} variant="destructive" className="text-xs">
                          {i.emoji} {i.name}: {i.current_stock} {i.unit}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add item button */}
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Tambah Item Baru
                  </Button>
                </DialogTrigger>
                <DialogContent>
                   <DialogHeader><DialogTitle>Tambah Item Stok</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    {/* Photo upload */}
                    <div>
                      <Label>Foto Item (opsional)</Label>
                      <input type="file" accept="image/*" ref={newItemFileRef} className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewItemPhoto(file);
                            setNewItemPhotoPreview(URL.createObjectURL(file));
                          }
                        }} />
                      <div className="mt-1 flex items-center gap-3">
                        {newItemPhotoPreview ? (
                          <img src={newItemPhotoPreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover border" />
                        ) : (
                          <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={() => newItemFileRef.current?.click()}>
                          <Camera className="h-4 w-4 mr-1.5" /> {newItemPhotoPreview ? 'Ganti Foto' : 'Upload Foto'}
                        </Button>
                        {newItemPhotoPreview && (
                          <Button type="button" variant="ghost" size="sm" className="text-destructive"
                            onClick={() => { setNewItemPhoto(null); setNewItemPhotoPreview(null); }}>Hapus</Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Nama Item</Label>
                      <Input placeholder="Contoh: Susu SGM" value={newItem.name}
                        onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Emoji</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {EMOJI_OPTIONS.map(e => (
                          <button key={e} onClick={() => setNewItem(p => ({ ...p, emoji: e }))}
                            className={`text-2xl p-1.5 rounded-lg border-2 transition-colors ${newItem.emoji === e ? 'border-primary bg-primary/10' : 'border-transparent hover:border-muted'}`}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Satuan</Label>
                        <Select value={newItem.unit} onValueChange={v => setNewItem(p => ({ ...p, unit: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Stok Awal</Label>
                        <Input type="number" placeholder="0" value={newItem.current_stock}
                          onChange={e => setNewItem(p => ({ ...p, current_stock: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label>Batas Stok Rendah</Label>
                      <Input type="number" placeholder="5" value={newItem.low_stock_threshold}
                        onChange={e => setNewItem(p => ({ ...p, low_stock_threshold: e.target.value }))} />
                    </div>
                    <Button className="w-full" disabled={!newItem.name || createItem.isPending}
                      onClick={() => createItem.mutate(newItem)}>
                      {createItem.isPending ? 'Menyimpan...' : 'Simpan Item'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Item list */}
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">Memuat...</div>
              ) : items.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-muted-foreground">
                  Belum ada item stok. Tambahkan item seperti susu, popok, vitamin, dll.
                </CardContent></Card>
              ) : (
                items.map(item => {
                  const daysLeft = getEstimatedDaysLeft(Number(item.current_stock), usageHistory, item.id);
                  const isLow = Number(item.current_stock) <= Number(item.low_stock_threshold);
                  const qty = useQty[item.id] || '1';
                  return (
                    <Card key={item.id} className={isLow ? 'border-destructive/40' : ''}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Item photo or emoji */}
                          <div className="relative group">
                            {item.photo_url ? (
                              <img src={item.photo_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover border" />
                            ) : (
                              <div className="text-3xl">{item.emoji}</div>
                            )}
                            <button
                              className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              onClick={() => setEditPhotoItemId(item.id)}
                            >
                              <Camera className="h-4 w-4 text-white" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm">{item.name}</h3>
                              <Button variant="ghost" size="sm" className="text-destructive h-6 px-2 text-xs"
                                onClick={() => deleteItem.mutate(item.id)}>Hapus</Button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-lg font-bold ${isLow ? 'text-destructive' : 'text-foreground'}`}>
                                {item.current_stock}
                              </span>
                              <span className="text-xs text-muted-foreground">{item.unit}</span>
                              {isLow && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Menipis!</Badge>}
                            </div>
                            {daysLeft !== null && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <TrendingDown className="inline h-3 w-3 mr-1" />
                                Estimasi habis dalam ~{daysLeft} hari
                              </p>
                            )}
                            {(item as any).notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic bg-muted/50 rounded px-2 py-1">
                                📝 {(item as any).notes}
                              </p>
                            )}
                            {/* Usage controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center border rounded-lg overflow-hidden">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none"
                                  onClick={() => setUseQty(p => ({ ...p, [item.id]: String(Math.max(1, Number(qty) - 1)) }))}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input type="number" className="h-8 w-12 text-center border-0 rounded-none p-0 text-sm"
                                  value={qty}
                                  onChange={e => setUseQty(p => ({ ...p, [item.id]: e.target.value }))} />
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none"
                                  onClick={() => setUseQty(p => ({ ...p, [item.id]: String(Number(qty) + 1) }))}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button size="sm" variant="default" className="h-8 text-xs"
                                disabled={recordUsage.isPending}
                                onClick={() => recordUsage.mutate({ itemId: item.id, quantity: Number(qty) || 1 })}>
                                Pakai
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-8 text-xs">Isi Ulang</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Isi Ulang {item.emoji} {item.name}</DialogTitle></DialogHeader>
                                  <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">Stok saat ini: {item.current_stock} {item.unit}</p>
                                    <div>
                                      <Label>Stok baru (total)</Label>
                                      <Input type="number" id={`restock-${item.id}`} defaultValue={String(item.current_stock)} />
                                    </div>
                                    <div>
                                      <Label>Catatan</Label>
                                      <Input id={`restock-note-${item.id}`} defaultValue={(item as any).notes || ''} placeholder="Catatan dari sitter..." />
                                    </div>
                                    <Button className="w-full" onClick={() => {
                                      const input = document.getElementById(`restock-${item.id}`) as HTMLInputElement;
                                      const noteInput = document.getElementById(`restock-note-${item.id}`) as HTMLInputElement;
                                      restockItem.mutate({ itemId: item.id, quantity: Number(input.value) || 0, notes: noteInput.value });
                                    }}>Perbarui Stok</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
               )}

              {/* Edit photo dialog */}
              <Dialog open={!!editPhotoItemId} onOpenChange={open => { if (!open) setEditPhotoItemId(null); }}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Ubah Foto Item</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    {(() => {
                      const editItem = items.find(i => i.id === editPhotoItemId);
                      return editItem ? (
                        <>
                          <div className="flex justify-center">
                            {editItem.photo_url ? (
                              <img src={editItem.photo_url} alt={editItem.name} className="h-24 w-24 rounded-xl object-cover border" />
                            ) : (
                              <div className="h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-4xl">
                                {editItem.emoji}
                              </div>
                            )}
                          </div>
                          <input type="file" accept="image/*" id="edit-photo-input" className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file && editPhotoItemId) {
                                setEditingPhoto(true);
                                updateItemPhoto.mutate({ itemId: editPhotoItemId, file });
                              }
                            }} />
                          <Button className="w-full" variant="outline" disabled={editingPhoto}
                            onClick={() => document.getElementById('edit-photo-input')?.click()}>
                            <Camera className="h-4 w-4 mr-2" /> {editingPhoto ? 'Mengupload...' : 'Pilih Foto Baru'}
                          </Button>
                        </>
                      ) : null;
                    })()}
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* TAB: Dashboard */}
            <TabsContent value="dashboard" className="space-y-4 mt-3">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2">
                <Card><CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">{items.length}</div>
                  <div className="text-[10px] text-muted-foreground">Total Item</div>
                </CardContent></Card>
                <Card className={lowStockItems.length > 0 ? 'border-destructive/40' : ''}>
                  <CardContent className="p-3 text-center">
                    <div className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-destructive' : ''}`}>{lowStockItems.length}</div>
                    <div className="text-[10px] text-muted-foreground">Stok Rendah</div>
                  </CardContent>
                </Card>
                <Card><CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">{usageHistory.filter(u => u.usage_date === format(new Date(), 'yyyy-MM-dd')).reduce((s, u) => s + Number(u.quantity), 0)}</div>
                  <div className="text-[10px] text-muted-foreground">Pakai Hari Ini</div>
                </CardContent></Card>
              </div>

              {/* Usage chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">📊 Pemakaian 7 Hari Terakhir</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  {chartData.some(d => d.total > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Pemakaian" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-muted-foreground py-8 text-sm">Belum ada data pemakaian</div>
                  )}
                </CardContent>
              </Card>

              {/* Estimated depletion */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">⏱️ Estimasi Habis</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {items.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-4">Belum ada item</div>
                  ) : (
                    items.map(item => {
                      const daysLeft = getEstimatedDaysLeft(Number(item.current_stock), usageHistory, item.id);
                      const isLow = Number(item.current_stock) <= Number(item.low_stock_threshold);
                      return (
                        <div key={item.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.emoji}</span>
                            <div>
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">Sisa: {item.current_stock} {item.unit}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {daysLeft !== null ? (
                              <Badge variant={isLow ? 'destructive' : daysLeft <= 7 ? 'secondary' : 'outline'} className="text-xs">
                                ~{daysLeft} hari
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Recent usage */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">🕒 Pemakaian Terakhir</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-1.5">
                  {usageHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-4">Belum ada riwayat pemakaian</div>
                  ) : (
                    usageHistory.slice(0, 10).map(u => {
                      const item = items.find(i => i.id === u.item_id);
                      return (
                        <div key={u.id} className="flex items-center justify-between py-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span>{item?.emoji || '📦'}</span>
                            <span>{item?.name || 'Unknown'}</span>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            -{u.quantity} {item?.unit || ''} · {format(new Date(u.usage_date), 'dd MMM', { locale: idLocale })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BottomNav role={effectiveRole === 'babysitter' ? 'babysitter' : 'parent'} />
    </div>
  );
};

export default InventoryPage;
