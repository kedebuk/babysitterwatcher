import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_ICONS, EventUnit, EventStatus } from '@/types';
import { Camera, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateEvent } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';

const ACTIVITY_OPTIONS: ActivityType[] = ['susu', 'mpasi', 'tidur', 'bangun', 'pup', 'pee', 'mandi', 'vitamin', 'lap_badan', 'catatan'];

interface EditEventDialogProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
}

export function EditEventDialog({ event, open, onOpenChange, childId }: EditEventDialogProps) {
  const { toast } = useToast();
  const updateEvent = useUpdateEvent();
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);

  const [detail, setDetail] = useState(event?.detail || '');
  const [amount, setAmount] = useState(event?.amount?.toString() || '');
  const [unit, setUnit] = useState<EventUnit>(event?.unit || 'ml');
  const [status, setStatus] = useState<EventStatus>(event?.status || null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(event?.photo_url || null);
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string | null>(event?.photo_url_after || null);
  const [newBeforeFile, setNewBeforeFile] = useState<File | null>(null);
  const [newAfterFile, setNewAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const actType = event?.type as ActivityType;
  const showAmountFields = actType === 'susu' || actType === 'mpasi' || actType === 'vitamin';

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${childId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('event-photos').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('event-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalBeforeUrl = photoUrl;
      let finalAfterUrl = afterPhotoUrl;

      if (newBeforeFile) {
        finalBeforeUrl = await uploadPhoto(newBeforeFile);
      }
      if (newAfterFile) {
        finalAfterUrl = await uploadPhoto(newAfterFile);
      }

      await updateEvent.mutateAsync({
        id: event.id,
        daily_log_id: event.daily_log_id,
        detail: detail || null,
        amount: amount ? Number(amount) : null,
        unit: unit || null,
        status: status || null,
        photo_url: finalBeforeUrl,
        photo_url_after: finalAfterUrl,
      });

      toast({ title: '✅ Diperbarui!', description: 'Event berhasil diubah' });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleBeforeFileChange = (file: File) => {
    setNewBeforeFile(file);
    if (beforePreview) URL.revokeObjectURL(beforePreview);
    setBeforePreview(URL.createObjectURL(file));
  };

  const handleAfterFileChange = (file: File) => {
    setNewAfterFile(file);
    if (afterPreview) URL.revokeObjectURL(afterPreview);
    setAfterPreview(URL.createObjectURL(file));
  };

  const displayBeforePhoto = beforePreview || photoUrl;
  const displayAfterPhoto = afterPreview || afterPhotoUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">✏️ Edit Event — {ACTIVITY_ICONS[actType]} {ACTIVITY_LABELS[actType]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Detail</label>
            <Input value={detail} onChange={e => setDetail(e.target.value)} placeholder="Detail aktivitas..." className="h-10 text-sm mt-1" />
          </div>

          {showAmountFields && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">Jumlah</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="h-10 text-sm mt-1" />
              </div>
              <div className="w-[80px]">
                <label className="text-xs font-medium text-muted-foreground">Satuan</label>
                <Select value={unit || 'ml'} onValueChange={v => setUnit(v as EventUnit)}>
                  <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="dosis">dosis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {actType === 'susu' && (
                <div className="w-[90px]">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={status || ''} onValueChange={v => setStatus(v as EventStatus)}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="habis">Habis</SelectItem>
                      <SelectItem value="sisa">Sisa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[11px] font-medium text-muted-foreground mb-1">📷 Foto Sebelum</p>
              {displayBeforePhoto ? (
                <div className="relative inline-block">
                  <img src={displayBeforePhoto} alt="Sebelum" className="rounded-lg w-20 h-20 object-cover" />
                  <button onClick={() => { setPhotoUrl(null); setNewBeforeFile(null); if (beforePreview) { URL.revokeObjectURL(beforePreview); setBeforePreview(null); } }} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => beforeFileRef.current?.click()}>
                  <Camera className="mr-1 h-3.5 w-3.5" /> Ambil Foto
                </Button>
              )}
              <input ref={beforeFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { if (e.target.files?.[0]) handleBeforeFileChange(e.target.files[0]); e.target.value = ''; }} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-muted-foreground mb-1">📷 Foto Sesudah</p>
              {displayAfterPhoto ? (
                <div className="relative inline-block">
                  <img src={displayAfterPhoto} alt="Sesudah" className="rounded-lg w-20 h-20 object-cover" />
                  <button onClick={() => { setAfterPhotoUrl(null); setNewAfterFile(null); if (afterPreview) { URL.revokeObjectURL(afterPreview); setAfterPreview(null); } }} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => afterFileRef.current?.click()}>
                  <Camera className="mr-1 h-3.5 w-3.5" /> Ambil Foto
                </Button>
              )}
              <input ref={afterFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { if (e.target.files?.[0]) handleAfterFileChange(e.target.files[0]); e.target.value = ''; }} />
            </div>
          </div>

          <Button className="w-full h-10 font-bold" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
