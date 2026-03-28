/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hubspot: {
          teal: '#00BDA5',
          orange: '#FF7A59',
          sidebar: '#F5F8FA',
          border: '#E5E8EB',
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        hubspot: {
          primary: '#00BDA5',
          secondary: '#FF7A59',
          accent: '#00BDA5',
          neutral: '#33475B',
          'base-100': '#FFFFFF',
          info: '#64B5F6',
          success: '#00BDA5',
          warning: '#FEC84B',
          error: '#F97066',
        },
      },
    ],
  },
};
