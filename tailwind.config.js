/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Silver/ink/white are CSS-variable-backed (see index.css :root /
        // html.dark) so every existing text-ink/NN, bg-white, bg-silver-50
        // etc. across the app repaints for dark mode with zero per-component
        // changes — only the variables flip when <html> gets .dark. Every
        // place `white` was used as a literal label color (not a surface —
        // e.g. "Add to bag" text on a flame button) was hardened to
        // text-[#fff] so it can't flip; see the bulk find/replace in the
        // Phase 6 commit.
        silver: {
          DEFAULT: 'rgb(var(--color-silver) / <alpha-value>)',
          50: 'rgb(var(--color-silver-50) / <alpha-value>)',
          100: 'rgb(var(--color-silver-100) / <alpha-value>)',
          200: 'rgb(var(--color-silver-200) / <alpha-value>)',
          300: 'rgb(var(--color-silver-300) / <alpha-value>)',
        },
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        white: 'rgb(var(--color-white) / <alpha-value>)',
        // Vibrant -> burnt orange accent ramp
        flame: {
          50: '#fff4ec',
          100: '#ffe2cc',
          300: '#ffaf66',
          400: '#ff8a1f',
          500: '#ff6b00', // primary accent
          600: '#ed5a00',
          700: '#c94800', // burnt
        },
      },
      fontFamily: {
        // Massive geometric sans for primary headings
        display: ['Archivo', 'system-ui', 'sans-serif'],
        // Secondary grotesk for medium headings / labels
        grotesk: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        // Authentic monospace for specs, pricing, body data
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
        // Pixel font for stylistic numbers / accents
        pixel: ['"Silkscreen"', 'monospace'],
      },
      fontSize: {
        // Oversized hero scale
        mega: ['clamp(7rem, 28vw, 26rem)', { lineHeight: '0.78', letterSpacing: '-0.04em' }],
        // Considered display scale (fluid, tight tracking) — use instead of eyeballing.
        'display-xl': ['clamp(3.5rem, 8vw, 7rem)', { lineHeight: '0.9', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.75rem, 6vw, 5rem)', { lineHeight: '0.92', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(2rem, 4vw, 3.25rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
      },
      // Motion tokens (mirror src/lib/motion.js + index.css custom properties).
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        fast: '180ms',
        base: '320ms',
        slow: '600ms',
      },
      backgroundImage: {
        'flame-gradient':
          'linear-gradient(110deg, #c94800 0%, #ff6b00 38%, #ff8a1f 70%, #ffaf66 100%)',
        'flame-soft':
          'linear-gradient(135deg, rgba(255,107,0,0.0) 0%, rgba(255,107,0,0.10) 100%)',
      },
      boxShadow: {
        // 3D drop for the floating product
        product: '0 40px 80px -20px rgba(0,0,0,0.45), 0 12px 24px -12px rgba(0,0,0,0.3)',
        panel: '0 1px 0 rgba(0,0,0,0.04), 0 18px 40px -24px rgba(0,0,0,0.35)',
        // Soft, diffuse elevation system (minimal / frosted aesthetic)
        soft: '0 2px 8px -2px rgba(17,17,17,0.05), 0 10px 28px -10px rgba(17,17,17,0.10)',
        'soft-lg': '0 4px 16px -6px rgba(17,17,17,0.07), 0 22px 50px -16px rgba(17,17,17,0.14)',
        'soft-xl': '0 8px 30px -10px rgba(17,17,17,0.10), 0 40px 80px -28px rgba(17,17,17,0.20)',
        lift: '0 18px 40px -16px rgba(17,17,17,0.22)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      keyframes: {
        // Satisfying squash-and-pop for add-to-cart + cart badge.
        addpop: {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(0.9)' },
          '70%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        badgepop: {
          '0%': { transform: 'scale(0.6)' },
          '60%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        addpop: 'addpop 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        badgepop: 'badgepop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
