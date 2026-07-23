/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF9F4',
        paper: '#FFFFFF',
        ink: '#141414',
        muted: '#6B6B6B',
        hairline: 'rgba(20,20,20,0.08)',
        balloon: { DEFAULT: '#E23744', deep: '#B4232F' },
        blush: { DEFAULT: '#E8859B', soft: '#F7DCE4', deep: '#C25B76' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        mono: ['"Courier Prime"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        control: '14px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,20,20,0.04), 0 8px 24px rgba(20,20,20,0.05)',
      },
    },
  },
  plugins: [],
}
