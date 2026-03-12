import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_ICONS, ACTIVITY_BADGE_CLASS } from '@/types';
import { getSmartIcon } from '@/lib/smart-icon';
import { Pencil, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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

function PhotoThumbnail({ src, label }: { src: string; label: string }) {
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <div className="text-center">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="rounded-lg overflow-hidden border focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <img
            src={src}
            alt={label}
            loading="lazy"
            decoding="async"
            width={112}
            height={112}
            className="w-28 h-28 object-cover hover:opacity-90 transition-opacity"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.parentElement!.style.display = 'none'; }}
          />
        </button>
        <span className="text-[10px] text-muted-foreground mt-1 block">{label}</span>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-1"
            onClick={() => setLightbox(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={label}
            className="max-w-[92vw] max-h-[85vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-6 text-white text-sm font-medium drop-shadow">{label}</span>
        </div>
      )}
    </>
  );
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
              {event.type === 'catatan' ? getSmartIcon(event.type, event.detail) : (ACTIVITY_ICONS[actType] || '📝')}
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
                {event.photo_url && <PhotoThumbnail src={event.photo_url} label="Sebelum" />}
                {event.photo_url_after && <PhotoThumbnail src={event.photo_url_after} label="Sesudah" />}
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
