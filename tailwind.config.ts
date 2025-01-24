import type { Config } from "tailwindcss";
import { createPreset } from "fumadocs-ui/tailwind-plugin";

const config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    "./node_modules/fumadocs-ui/dist/**/*.js",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        border: {
          "100": "hsl(var(--border-100))",
          "200": "hsl(var(--border-200))",
          "300": "hsl(var(--border-300))",
          "400": "hsl(var(--border-400))",
          "500": "hsl(var(--border-500))",
          DEFAULT: "hsl(var(--border))",
        },
        bg: {
          "100": "hsl(var(--bg-100))",
          "200": "hsl(var(--bg-200))",
          "300": "hsl(var(--bg-300))",
          "400": "hsl(var(--bg-400))",
          "500": "hsl(var(--bg-500))",
          DEFAULT: "hsl(var(--bg))",
        },
        fg: {
          "100": "hsl(var(--fg-100))",
          "200": "hsl(var(--fg-200))",
          "300": "hsl(var(--fg-300))",
          "400": "hsl(var(--fg-400))",
          "500": "hsl(var(--fg-500))",
          DEFAULT: "hsl(var(--fg))",
        },
        accent: {
          "100": "hsl(var(--accent-100))",
          "200": "hsl(var(--accent-200))",
          "300": "hsl(var(--accent-300))",
          "400": "hsl(var(--accent-400))",
          "500": "hsl(var(--accent-500))",
          DEFAULT: "hsl(var(--accent))",
        },
        error: {
          "100": "hsl(var(--error-100))",
          "200": "hsl(var(--error-200))",
          "300": "hsl(var(--error-300))",
          "400": "hsl(var(--error-400))",
          "500": "hsl(var(--error-500))",
          DEFAULT: "hsl(var(--error))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          fg: "hsl(var(--success-fg))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / 0.2)",
          fg: "hsl(var(--warning))",
        },
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        contrast: {
          "1": "hsl(var(--contrast-1))",
          "2": "hsl(var(--contrast-2))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        wave: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "100% 0",
          },
          "100%": {
            backgroundPosition: "-100% 0",
          },
        },
        grid: {
          "0%": {
            transform: "translateY(-50%)",
          },
          "100%": {
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 1s ease-in-out infinite",
        grid: "grid 30s linear infinite",
        wave: "wave 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("tailwind-scrollbar")],
  presets: [
    // Matchs Fumadocs colors to our theme
    createPreset({
      preset: {
        light: {
          background: "var(--bg)",
          foreground: "var(--fg)",
          muted: "var(--bg-100)",
          "muted-foreground": "var(--fg-300)",
          popover: "var(--bg)",
          "popover-foreground": "var(--fg)",
          card: "var(--bg)",
          "card-foreground": "var(--fg)",
          primary: "var(--accent)",
          "primary-foreground": "var(--accent-fg)",
          secondary: "var(--bg-100)",
          "secondary-foreground": "var(--fg)",
          accent: "var(--bg-100)",
          "accent-foreground": "var(--fg)",
          ring: "var(--ring)",
          border: "var(--border)",
        },
        dark: {
          background: "var(--bg)",
          foreground: "var(--fg)",
          muted: "var(--bg-100)",
          "muted-foreground": "var(--fg-500)",
          popover: "var(--bg)",
          "popover-foreground": "var(--fg)",
          card: "var(--bg)",
          "card-foreground": "var(--fg)",
          primary: "var(--accent)",
          "primary-foreground": "var(--accent-fg)",
          secondary: "var(--bg-100)",
          "secondary-foreground": "var(--fg)",
          accent: "var(--bg-100)",
          "accent-foreground": "var(--fg)",
          ring: "var(--ring)",
          border: "var(--border)",
        },
      },
    }),
  ],
} satisfies Config;

export default config;
