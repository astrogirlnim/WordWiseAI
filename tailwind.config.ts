import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Professional Retro Tech Colors
        'retro-accent': 'hsl(var(--retro-accent))',
        'retro-amber': 'hsl(var(--retro-amber))',
        'retro-green': 'hsl(var(--retro-green))',
        'retro-blue': 'hsl(var(--retro-blue))',
        'retro-purple': 'hsl(var(--retro-purple))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
        terminal: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
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
        'retro-pulse': {
          '0%, 100%': {
            textShadow: '0 0 5px currentColor',
          },
          '50%': {
            textShadow: '0 0 10px currentColor, 0 0 15px currentColor',
          },
        },
        'retro-glow': {
          '0%': {
            boxShadow: '0 0 5px hsl(var(--retro-accent))',
          },
          '50%': {
            boxShadow: '0 0 10px hsl(var(--retro-accent)), 0 0 15px hsl(var(--retro-accent))',
          },
          '100%': {
            boxShadow: '0 0 5px hsl(var(--retro-accent))',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'retro-pulse': 'retro-pulse 2s ease-in-out infinite',
        'retro-glow': 'retro-glow 2s ease-in-out infinite',
      },
      textShadow: {
        'retro-glow': '0 0 10px currentColor',
        'retro-glow-soft': '0 0 5px currentColor',
      },
      boxShadow: {
        'retro-border': '0 0 8px hsl(var(--retro-accent))',
        'retro-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px hsl(var(--border))',
        'retro-glow-sm': '0 0 10px hsl(var(--retro-accent))',
        'retro-glow-md': '0 0 15px hsl(var(--retro-accent))',
        'retro-glow-lg': '0 0 20px hsl(var(--retro-accent))',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    // Add custom plugin for retro tech utilities
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.text-glow': {
          textShadow: '0 0 10px currentColor',
        },
        '.text-glow-soft': {
          textShadow: '0 0 5px currentColor',
        },
        '.border-glow': {
          boxShadow: '0 0 8px hsl(var(--retro-accent))',
        },
        '.retro-card': {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'calc(var(--radius) - 2px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px hsl(var(--border))',
        },
        '.retro-button': {
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          border: '1px solid hsl(var(--retro-accent))',
          borderRadius: 'calc(var(--radius) - 2px)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 10px hsl(var(--retro-accent))',
            borderColor: 'hsl(var(--retro-accent))',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
export default config
