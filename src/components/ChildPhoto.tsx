import { useState, useRef, useEffect } from 'react';

interface ChildPhotoProps {
  photoUrl?: string | null;
  name: string;
  emoji?: string | null;
  size?: number;
  className?: string;
}

export function ChildPhoto({ photoUrl, name, emoji, size = 44, className = 'h-11 w-11 rounded-xl' }: ChildPhotoProps) {
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle case where error fires before React attaches onError (cached broken image)
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setError(true);
    }
  }, [photoUrl]);

  // Reset error state when photoUrl changes
  useEffect(() => {
    setError(false);
  }, [photoUrl]);

  if (photoUrl && !error) {
    return (
      <img
        ref={imgRef}
        src={photoUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        width={size}
        height={size}
        className={`${className} object-cover shrink-0`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`${className} bg-secondary flex items-center justify-center text-xl shrink-0`}>
      {emoji || '👶'}
    </div>
  );
}
