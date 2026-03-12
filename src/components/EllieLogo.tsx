import React from 'react';

interface EllieLogoProps {
  size?: number;
  className?: string;
}

/**
 * Ellie Logo — a cute, minimal elephant silhouette.
 * The name "Ellie" is a nod to elephants, known for their
 * nurturing, protective nature — perfect for a caretaker app.
 */
export const EllieLogo: React.FC<EllieLogoProps> = ({ size = 64, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Ellie logo"
  >
    {/* Soft circle background */}
    <rect width="120" height="120" rx="32" fill="url(#ellie-bg)" />

    {/* Elephant body — simplified, cute shape */}
    <g transform="translate(18, 22)" fill="white" fillOpacity="0.95">
      {/* Head + ear */}
      <ellipse cx="42" cy="34" rx="28" ry="26" />
      {/* Big ear */}
      <path d="M14 20C4 14 0 24 2 36C4 46 14 48 18 42C12 36 12 26 14 20Z" fillOpacity="0.7" />
      {/* Body */}
      <ellipse cx="58" cy="52" rx="24" ry="20" />
      {/* Front leg */}
      <rect x="40" y="62" width="10" height="16" rx="5" />
      {/* Back leg */}
      <rect x="62" y="62" width="10" height="16" rx="5" />
      {/* Trunk — cute curled trunk */}
      <path
        d="M26 44C22 48 18 56 20 62C22 66 26 66 28 62C30 58 28 52 32 48"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.95"
      />
      {/* Eye */}
      <circle cx="38" cy="30" r="3.5" fill="url(#ellie-bg)" />
      {/* Eye highlight */}
      <circle cx="39.2" cy="28.8" r="1.2" fill="white" />
      {/* Tiny tail */}
      <path
        d="M80 46C84 42 86 38 84 36"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.7"
      />
      {/* Heart on the body */}
      <path
        d="M56 44C56 42 58 40 60 40C62 40 63 42 63 44C63 42 64 40 66 40C68 40 70 42 70 44C70 48 63 52 63 52C63 52 56 48 56 44Z"
        fill="url(#ellie-bg)"
        fillOpacity="0.4"
      />
    </g>

    <defs>
      <linearGradient id="ellie-bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop stopColor="hsl(35, 92%, 60%)" />
        <stop offset="1" stopColor="hsl(15, 85%, 60%)" />
      </linearGradient>
    </defs>
  </svg>
);

/** Compact version for navigation bars and small spaces */
export const EllieLogoMark: React.FC<EllieLogoProps> = ({ size = 32, className = '' }) => (
  <EllieLogo size={size} className={className} />
);

export default EllieLogo;
