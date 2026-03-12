import React from 'react';

interface EllieLogoProps {
  size?: number;
  className?: string;
}

/**
 * Ellie Logo — uses the generated elephant PNG.
 */
export const EllieLogo: React.FC<EllieLogoProps> = ({ size = 64, className = '' }) => (
  <img
    src="/ellie-logo-cropped.png"
    alt="Ellie logo"
    width={size}
    height={size}
    className={className}
    style={{ borderRadius: size * 0.22, objectFit: 'cover' }}
  />
);

/** Compact version for navigation bars and small spaces */
export const EllieLogoMark: React.FC<EllieLogoProps> = ({ size = 32, className = '' }) => (
  <EllieLogo size={size} className={className} />
);

export default EllieLogo;
