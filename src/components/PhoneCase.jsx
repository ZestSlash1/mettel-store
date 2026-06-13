/**
 * Self-contained vector phone case used as the default hero/product visual.
 * Replace with real transparent PNGs by setting `product.image` in Supabase
 * and rendering an <img> instead — the layout slot is identical.
 */
export default function PhoneCase({ shell = '#cfcfcf', accent = '#ff6b00', className = '' }) {
  return (
    <svg
      viewBox="0 0 300 600"
      className={className}
      role="img"
      aria-label="MetTel phone case, rear view"
    >
      <defs>
        <linearGradient id="shellGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="22%" stopColor={shell} />
          <stop offset="78%" stopColor="#9c9c9c" />
          <stop offset="100%" stopColor="#7a7a7a" />
        </linearGradient>
        <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6f6f6f" />
          <stop offset="50%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#6f6f6f" />
        </linearGradient>
        <linearGradient id="lensGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>

      {/* Outer edge / side rail */}
      <rect x="14" y="6" width="272" height="588" rx="58" fill="url(#edgeGrad)" />
      {/* Main shell */}
      <rect x="22" y="14" width="256" height="572" rx="52" fill="url(#shellGrad)" />
      {/* Inner cutout highlight */}
      <rect
        x="22"
        y="14"
        width="256"
        height="572"
        rx="52"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />

      {/* Camera module */}
      <rect x="44" y="40" width="118" height="118" rx="30" fill="#d7d7d7" />
      <rect
        x="44"
        y="40"
        width="118"
        height="118"
        rx="30"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.6"
      />
      {/* Lenses */}
      <circle cx="80" cy="78" r="20" fill="url(#lensGrad)" />
      <circle cx="80" cy="78" r="9" fill="#111" />
      <circle cx="76" cy="74" r="3" fill="#3d3d3d" />
      <circle cx="126" cy="78" r="20" fill="url(#lensGrad)" />
      <circle cx="126" cy="78" r="9" fill="#111" />
      <circle cx="122" cy="74" r="3" fill="#3d3d3d" />
      <circle cx="80" cy="124" r="20" fill="url(#lensGrad)" />
      <circle cx="80" cy="124" r="9" fill="#111" />
      {/* Flash + sensor */}
      <circle cx="126" cy="120" r="6" fill="#f3f3e0" />
      <rect x="118" y="132" width="16" height="6" rx="3" fill="#2a2a2a" />

      {/* Engraved wordmark */}
      <text
        x="150"
        y="320"
        textAnchor="middle"
        fontFamily="'Archivo', sans-serif"
        fontWeight="900"
        fontSize="58"
        letterSpacing="-3"
        fill="#8c8c8c"
      >
        MT
      </text>
      <text
        x="150"
        y="360"
        textAnchor="middle"
        fontFamily="'Space Mono', monospace"
        fontSize="11"
        letterSpacing="4"
        fill="#9a9a9a"
      >
        METTEL
      </text>

      {/* Accent index tab */}
      <rect x="118" y="540" width="64" height="10" rx="5" fill={accent} />

      {/* Subtle long reflection */}
      <rect x="40" y="180" width="40" height="380" rx="20" fill="#ffffff" opacity="0.18" />
    </svg>
  )
}
