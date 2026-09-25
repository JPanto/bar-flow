/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          bg: 'var(--apple-bg)',
          primary: 'var(--apple-bg-primary)',
          secondary: 'var(--apple-bg-secondary)',
          tertiary: 'var(--apple-bg-tertiary)',
          grouped: 'var(--apple-bg-grouped)',
          card: 'var(--apple-card)',
          'card-elevated': 'var(--apple-card-elevated)',
          label: 'var(--apple-label)',
          'label-sec': 'var(--apple-label-secondary)',
          'label-ter': 'var(--apple-label-tertiary)',
          separator: 'var(--apple-separator)',
          border: 'var(--apple-border)',
          fill: 'var(--apple-fill)',
          blue: 'var(--apple-blue)',
          green: 'var(--apple-green)',
          indigo: 'var(--apple-indigo)',
          orange: 'var(--apple-orange)',
          pink: 'var(--apple-pink)',
          purple: 'var(--apple-purple)',
          red: 'var(--apple-red)',
          teal: 'var(--apple-teal)',
          yellow: 'var(--apple-yellow)',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        status: {
          available: '#34c759', // Apple HIG Green
          occupied: '#ff3b30',  // Apple HIG Red
          reserved: '#ff9500',  // Apple HIG Orange
          blocked: '#8e8e93',   // Apple HIG Gray
        }
      }
    },
  },
  plugins: [],
}
