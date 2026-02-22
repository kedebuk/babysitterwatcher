import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_ICONS, ACTIVITY_BADGE_CLASS } from '@/types';
import { Pencil } from 'lucide-react';

interface EventDetailDialogProps {
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdByName?: string;
  onEdit?: () => void;
}

export function EventDetailDialog({ event, open, onOpenChange, createdByName, onEdit }: EventDetailDialogProps) {
  if (!event) return null;
  const actType = event.type as ActivityType;

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
          {/* Detail */}
          {event.detail && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">📝 Detail</p>
              <p className="text-sm">{event.detail}</p>
            </div>
          )}

          {/* Amount */}
          {event.amount && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">📊 Jumlah</p>
              <p className="text-sm font-semibold">{event.amount} {event.unit}{event.status ? ` — ${event.status}` : ''}</p>
            </div>
          )}

          {/* Created by */}
          {createdByName && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">👤 Dicatat oleh</p>
              <p className="text-sm">{createdByName}</p>
            </div>
          )}

          {/* Photos */}
          {(event.photo_url || event.photo_url_after) && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1.5">📷 Foto</p>
              <div className="flex gap-3">
                {event.photo_url && (
                  <div className="text-center">
                    <img src={event.photo_url} alt="Sebelum" className="rounded-lg w-28 h-28 object-cover border" />
                    <span className="text-[10px] text-muted-foreground mt-1 block">Sebelum</span>
                  </div>
                )}
                {event.photo_url_after && (
                  <div className="text-center">
                    <img src={event.photo_url_after} alt="Sesudah" className="rounded-lg w-28 h-28 object-cover border" />
                    <span className="text-[10px] text-muted-foreground mt-1 block">Sesudah</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No detail/photo fallback */}
          {!event.detail && !event.amount && !event.photo_url && !event.photo_url_after && (
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
