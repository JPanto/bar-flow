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
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        status: {
          available: '#10b981', // Emerald
          occupied: '#ef4444',  // Rose / Red
          reserved: '#f59e0b',  // Amber
          blocked: '#64748b',   // Slate
        }
      }
    },
  },
  plugins: [],
}
