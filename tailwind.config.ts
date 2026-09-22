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
      sans: ['"Geist Variable"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
      serif: ['"Geist Variable"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
      display: ['"Geist Variable"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
      mono: ['"Geist Mono Variable"', '"SFMono-Regular"', "Consolas", "ui-monospace", "monospace"],
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
        intelligence: {
          DEFAULT: "hsl(var(--brand-intelligence))",
          soft: "hsl(var(--intelligence-soft))",
        },
        financial: {
          income: "hsl(var(--status-income))",
          expense: "hsl(var(--status-expense))",
          warning: "hsl(var(--status-warning))",
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
        display: ["3rem", { lineHeight: "1.08", fontWeight: "600" }],
        "page-title": ["2rem", { lineHeight: "1.15", fontWeight: "600" }],
        "panel-title": ["1.25rem", { lineHeight: "1.25", fontWeight: "600" }],
        "compact-title": ["0.9375rem", { lineHeight: "1.35", fontWeight: "600" }],
        value: ["1.375rem", { lineHeight: "1.1", fontWeight: "600" }],
        body: ["0.9375rem", { lineHeight: "1.55", fontWeight: "400" }],
        "body-small": ["0.8125rem", { lineHeight: "1.45", fontWeight: "400" }],
        label: ["0.75rem", { lineHeight: "1.3", fontWeight: "600" }],
      },
      boxShadow: {
        menu: "0 12px 32px hsl(var(--void) / 0.18)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-up": "accordion-up 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
