/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light silver / off-white system
        silver: {
          DEFAULT: '#f0f0f0',
          50: '#fafafa',
          100: '#f4f4f4',
          200: '#e6e6e6',
          300: '#d4d4d4',
        },
        ink: '#000000',
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
        'dash-march': {
          to: { strokeDashoffset: '-16' },
        },
      },
      animation: {
        'dash-march': 'dash-march 0.6s linear infinite',
      },
    },
  },
  plugins: [],
}
