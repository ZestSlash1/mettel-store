/**
 * Category-neutral placeholder used when a product has no uploaded image.
 * Replaces the phone-case vector in product slots so non-case items (audio,
 * drinkware, etc.) don't render as a phone case. Same props as <PhoneCase>
 * (shell/accent/className) so it's a drop-in fallback. Upload a real image to
 * override it. The hero keeps <PhoneCase> as decorative brand art.
 */
export default function ProductGraphic({ shell = '#cfcfcf', accent = '#ff6b00', className = '' }) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="MetTel product">
      <defs>
        <linearGradient id="pgShell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor={shell} />
          <stop offset="100%" stopColor="#9c9c9c" />
        </linearGradient>
      </defs>

      {/* Object tile */}
      <rect
        x="20"
        y="20"
        width="260"
        height="260"
        rx="44"
        fill="url(#pgShell)"
        stroke="#ffffff"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />

      {/* Accent index tab */}
      <rect x="40" y="40" width="72" height="12" rx="6" fill={accent} />

      {/* Monogram */}
      <text
        x="150"
        y="178"
        textAnchor="middle"
        fontFamily="'Archivo', sans-serif"
        fontWeight="900"
        fontSize="96"
        letterSpacing="-5"
        fill="#8c8c8c"
      >
        MT
      </text>

      {/* Pixel accent block, echoing the brand motif */}
      <g fill={accent} opacity="0.85">
        <rect x="208" y="232" width="10" height="10" />
        <rect x="222" y="232" width="10" height="10" />
        <rect x="222" y="246" width="10" height="10" />
      </g>
    </svg>
  )
}
