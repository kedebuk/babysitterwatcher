import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_ICONS, ACTIVITY_BADGE_CLASS } from '@/types';
import { Pencil, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StorageImage } from '@/components/StorageImage';

interface EventDetailDialogProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdByName?: string;
  onEdit?: () => void;
}

function useReverseGeocode(lat: number | null, lng: number | null) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    if (!lat || !lng) { setName(null); return; }
    setName(null);
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`, {
      headers: { 'Accept-Language': 'id' },
    })
      .then(r => r.json())
      .then(data => {
        const a = data.address;
        const parts = [a?.village || a?.suburb || a?.neighbourhood, a?.city || a?.town || a?.county, a?.state].filter(Boolean);
        setName(parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',') || null);
      })
      .catch(() => setName(null));
  }, [lat, lng]);
  return name;
}

export function EventDetailDialog({ event, open, onOpenChange, createdByName, onEdit }: EventDetailDialogProps) {
  if (!event) return null;
  const actType = event.type as ActivityType;
  const hasCoords = event.latitude && event.longitude;
  const areaName = useReverseGeocode(hasCoords ? event.latitude : null, hasCoords ? event.longitude : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${ACTIVITY_BADGE_CLASS[actType] || 'activity-badge-other'}`}>
              {ACTIVITY_ICONS[actType] || '📝'}
            </span>
            {ACTIVITY_LABELS[actType] || event.type}
            <span className="text-sm font-normal text-muted-foreground ml-auto">{event.time?.substring(0, 5)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-3">
          {event.detail && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">📝 Detail</p>
              <p className="text-sm">{event.detail}</p>
            </div>
          )}

          {event.amount && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">📊 Jumlah</p>
              <p className="text-sm font-semibold">{event.amount} {event.unit}{event.status ? ` — ${event.status}` : ''}</p>
            </div>
          )}

          {createdByName && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">👤 Dicatat oleh</p>
              <p className="text-sm">{createdByName}</p>
            </div>
          )}

          {hasCoords && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">📍 Lokasi</p>
              <a
                href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {areaName || `${Number(event.latitude).toFixed(5)}, ${Number(event.longitude).toFixed(5)}`}
              </a>
            </div>
          )}

          {(event.photo_url || event.photo_url_after) && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1.5">📷 Foto</p>
              <div className="flex gap-3">
                {event.photo_url && (
                  <div className="text-center">
                    <StorageImage src={event.photo_url} alt="Sebelum" className="rounded-lg w-28 h-28 object-cover border" />
                    <span className="text-[10px] text-muted-foreground mt-1 block">Sebelum</span>
                  </div>
                )}
                {event.photo_url_after && (
                  <div className="text-center">
                    <StorageImage src={event.photo_url_after} alt="Sesudah" className="rounded-lg w-28 h-28 object-cover border" />
                    <span className="text-[10px] text-muted-foreground mt-1 block">Sesudah</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!event.detail && !event.amount && !event.photo_url && !event.photo_url_after && !hasCoords && (
            <p className="text-sm text-muted-foreground italic">Tidak ada detail tambahan.</p>
          )}

          {onEdit && (
            <Button variant="outline" className="w-full h-10 text-sm" onClick={() => { onOpenChange(false); onEdit(); }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Event
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}