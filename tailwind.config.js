// @ts-check
const { fontFamily } = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

const myGreen = {
  50: '#E0FF62',
  100: '#DCFF4D',
  200: '#D4FF24',
  300: '#CAFB00',
  400: '#A9D200',
  500: '#88A900',
  600: '#5B7100',
  700: '#2E3900',
  800: '#252E00',
  900: '#1C2300',
  950: '#131700',
}

const myGray = {
  50: '#F1F2F3',
  100: '#E0E2E5',
  200: '#C2C5CC',
  300: '#A6ABB5',
  400: '#888E9B',
  500: '#6B7280',
  600: '#565C67',
  700: '#41454E',
  800: '#2A2D32',
  900: '#151619',
  950: '#0C0C0E',
}

/** @type {import("tailwindcss/types").Config } */
module.exports = {
  content: ['./src/**/*.{ts,tsx,html,js}'],
  theme: {
    extend: {
      lineHeight: {
        11: '2.75rem',
        12: '3rem',
        13: '3.25rem',
        14: '3.5rem',
      },
      colors: {
        primary: myGreen,
        gray: myGray,
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: `${theme('colors.primary.600')}`,
              },
              code: { color: theme('colors.primary.400') },
            },
            'h1,h2': {
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
            },
            h3: {
              fontWeight: '600',
            },
            code: {
              color: theme('colors.indigo.500'),
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: `${theme('colors.primary.400')}`,
              },
              code: { color: theme('colors.primary.400') },
            },
            'h1,h2,h3,h4,h5,h6': {
              color: theme('colors.gray.100'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
}
