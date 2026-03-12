import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function extractPath(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

interface ChildAvatarProps {
  photoUrl?: string | null;
  name: string;
  emoji?: string | null;
  className?: string;
  fallbackClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function ChildAvatar({ photoUrl, name, emoji, className = 'h-11 w-11 rounded-xl object-cover shrink-0', fallbackClassName, onClick }: ChildAvatarProps) {
  const [src, setSrc] = useState(photoUrl || '');
  const [showFallback, setShowFallback] = useState(!photoUrl);
  const [triedSigned, setTriedSigned] = useState(false);

  const handleError = async () => {
    if (!triedSigned && photoUrl) {
      setTriedSigned(true);
      const path = extractPath(photoUrl, 'child-photos');
      if (path) {
        const { data } = await supabase.storage.from('child-photos').createSignedUrl(path, 3600);
        if (data?.signedUrl) {
          setSrc(data.signedUrl);
          return;
        }
      }
    }
    setShowFallback(true);
  };

  if (showFallback) {
    return (
      <div className={fallbackClassName || className?.replace('object-cover', '').trim() + ' bg-secondary flex items-center justify-center'}>
        {emoji || '👶'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      className={`${className} cursor-pointer`}
      onClick={onClick || (() => photoUrl && window.open(src, '_blank'))}
      onError={handleError}
    />
  );
}
