import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        border: {
          '100': 'hsl(var(--border-100))',
          '200': 'hsl(var(--border-200))',
          '300': 'hsl(var(--border-300))',
          '400': 'hsl(var(--border-400))',
          '500': 'hsl(var(--border-500))',
          DEFAULT: 'hsl(var(--border))',
        },
        bg: {
          '100': 'hsl(var(--bg-100))',
          '200': 'hsl(var(--bg-200))',
          '300': 'hsl(var(--bg-300))',
          '400': 'hsl(var(--bg-400))',
          '500': 'hsl(var(--bg-500))',
          DEFAULT: 'hsl(var(--bg))',
        },
        fg: {
          '100': 'hsl(var(--fg-100))',
          '200': 'hsl(var(--fg-200))',
          '300': 'hsl(var(--fg-300))',
          '400': 'hsl(var(--fg-400))',
          '500': 'hsl(var(--fg-500))',
          DEFAULT: 'hsl(var(--fg))',
        },
        accent: {
          '100': 'hsl(var(--accent-100))',
          '200': 'hsl(var(--accent-200))',
          '300': 'hsl(var(--accent-300))',
          '400': 'hsl(var(--accent-400))',
          '500': 'hsl(var(--accent-500))',
          DEFAULT: 'hsl(var(--accent))',
        },
        error: {
          '100': 'hsl(var(--error-100))',
          '200': 'hsl(var(--error-200))',
          '300': 'hsl(var(--error-300))',
          '400': 'hsl(var(--error-400))',
          '500': 'hsl(var(--error-500))',
          DEFAULT: 'hsl(var(--error))',
          fg: 'hsl(var(--error-fg))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          fg: 'hsl(var(--success-fg))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          fg: 'hsl(var(--warning-fg))',
        },
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        contrast: {
          '1': 'hsl(var(--contrast-1))',
          '2': 'hsl(var(--contrast-2))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        wave: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '100% 0',
          },
          '100%': {
            backgroundPosition: '-100% 0',
          },
        },
        grid: {
          '0%': {
            transform: 'translateY(-50%)',
          },
          '100%': {
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1s ease-in-out infinite',
        grid: 'grid 30s linear infinite',
        wave: 'wave 2s linear infinite',
      },
      boxShadow: {
        sm: '0 1px 2px hsl(var(--shadow) / calc(var(--shadow-strength) + 0.01)), 0 1px 1px hsl(var(--shadow) / var(--shadow-strength))',
        DEFAULT:
          '0 1px 3px hsl(var(--shadow) / calc(var(--shadow-strength) + 0.01)), 0 1px 2px hsl(var(--shadow) / var(--shadow-strength))',
        md: '0 4px 6px hsl(var(--shadow) / calc(var(--shadow-strength) + 0.01)), 0 2px 4px hsl(var(--shadow) / var(--shadow-strength))',
        lg: '0 10px 15px hsl(var(--shadow) / calc(var(--shadow-strength) + 0.01)), 0 4px 6px hsl(var(--shadow) / var(--shadow-strength))',
        xl: '0 20px 25px hsl(var(--shadow) / calc(var(--shadow-strength) + 0.01)), 0 8px 10px hsl(var(--shadow) / var(--shadow-strength))',
        '2xl':
          '0 25px 50px hsl(var(--shadow) / calc(var(--shadow-strength) + 0.15))',
        inner:
          'inset 0 2px 4px hsl(var(--shadow) / calc(var(--shadow-strength) - 0.05))',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar')],
} satisfies Config

export default config
