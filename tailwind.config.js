/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        'primary-dark': '#E85555',
        success: '#4CAF50',
        warning: '#FFD93D',
        danger: '#EF4444',
        surface: '#F9FAFB',
        'surface-dark': '#1F2937',
        slate: '#334155',
        reward: '#FFD93D',
      },
    },
  },
};
