import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1280px" },
    },
    fontFamily: {
      sans: ['"DM Sans"', '"Helvetica Neue"', "system-ui", "sans-serif"],
      serif: ['"Fraunces"', "Georgia", "serif"],
      display: ['"Fraunces"', "Georgia", "serif"],
      mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          wash: "hsl(var(--warning-wash))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          wash: "hsl(var(--success-wash))",
        },
        data: {
          blue: "hsl(var(--data-blue))",
          violet: "hsl(var(--data-violet))",
        },
        marker: "hsl(var(--marker))",
        ink: "hsl(var(--ink-panel))",
        "app-bg": "hsl(var(--app-bg))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius-panel)",
        md: "var(--radius-control)",
        sm: "var(--radius-control)",
      },
      fontSize: {
        display: ["2.5rem", { lineHeight: "1.05", fontWeight: "500" }],
        "page-title": ["2rem", { lineHeight: "1.15", fontWeight: "600" }],
        "panel-title": ["1.375rem", { lineHeight: "1.25", fontWeight: "600" }],
        "compact-title": ["1rem", { lineHeight: "1.35", fontWeight: "650" }],
        value: ["1.375rem", { lineHeight: "1.1", fontWeight: "650" }],
        body: ["0.9375rem", { lineHeight: "1.55", fontWeight: "400" }],
        "body-small": ["0.8125rem", { lineHeight: "1.45", fontWeight: "450" }],
        label: ["0.75rem", { lineHeight: "1.3", fontWeight: "650" }],
      },
      fontWeight: {
        450: "450",
        650: "650",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 180ms ease-out",
        "accordion-up": "accordion-up 180ms ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
