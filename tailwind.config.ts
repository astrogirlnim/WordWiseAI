import type { Config } from 'tailwindcss'

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
        // Organic Retrowave/Synthwave Colors
        'retro-primary': 'hsl(var(--retro-primary))',
        'retro-secondary': 'hsl(var(--retro-secondary))',
        'retro-accent': 'hsl(var(--retro-accent))',
        'retro-sunset': 'hsl(var(--retro-sunset))',
        'retro-cyan': 'hsl(var(--retro-cyan))',
        'retro-earth-pink': 'hsl(var(--retro-earth-pink))',
        'retro-dust-rose': 'hsl(var(--retro-dust-rose))',
        'retro-coral': 'hsl(var(--retro-coral))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        retrowave: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'synthwave-gradient': 'linear-gradient(135deg, hsl(var(--retro-background-start)), hsl(var(--retro-background-end)))',
        'sunset-gradient': 'linear-gradient(135deg, hsl(var(--retro-sunset-start)), hsl(var(--retro-sunset-end)))',
        'organic-pattern': 'radial-gradient(circle at 25% 25%, hsl(var(--retro-primary) / 0.05) 0%, transparent 45%), radial-gradient(circle at 75% 75%, hsl(var(--retro-secondary) / 0.03) 0%, transparent 45%)',
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
        'retrowave-pulse': {
          '0%, 100%': {
            textShadow: '0 0 8px currentColor, 0 0 16px currentColor',
          },
          '50%': {
            textShadow: '0 0 15px currentColor, 0 0 30px currentColor, 0 0 45px currentColor',
          },
        },
        'synthwave-glow': {
          '0%': {
            boxShadow: '0 0 10px hsl(var(--retro-primary)), 0 0 20px hsl(var(--retro-primary) / 0.3)',
          },
          '50%': {
            boxShadow: '0 0 20px hsl(var(--retro-primary)), 0 0 40px hsl(var(--retro-primary) / 0.5), 0 0 60px hsl(var(--retro-primary) / 0.2)',
          },
          '100%': {
            boxShadow: '0 0 10px hsl(var(--retro-primary)), 0 0 20px hsl(var(--retro-primary) / 0.3)',
          },
        },
        'sunset-shift': {
          '0%': { backgroundColor: 'hsl(var(--retro-sunset))' },
          '50%': { backgroundColor: 'hsl(var(--retro-primary))' },
          '100%': { backgroundColor: 'hsl(var(--retro-sunset))' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'retrowave-pulse': 'retrowave-pulse 3s ease-in-out infinite',
        'synthwave-glow': 'synthwave-glow 4s ease-in-out infinite',
        'sunset-shift': 'sunset-shift 6s ease-in-out infinite',
      },
      textShadow: {
        'retrowave-glow': '0 0 15px currentColor, 0 0 30px currentColor',
        'retrowave-glow-soft': '0 0 8px currentColor, 0 0 16px currentColor',
        'synthwave-bright': '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
      },
      boxShadow: {
        'retrowave-border': '0 0 15px hsl(var(--retro-primary)), 0 0 30px hsl(var(--retro-primary) / 0.3)',
        'retrowave-card': '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px hsl(var(--border))',
        'synthwave-glow-sm': '0 0 15px hsl(var(--retro-primary))',
        'synthwave-glow-md': '0 0 25px hsl(var(--retro-primary)), 0 0 50px hsl(var(--retro-primary) / 0.4)',
        'synthwave-glow-lg': '0 0 35px hsl(var(--retro-primary)), 0 0 70px hsl(var(--retro-primary) / 0.4)',
        'earth-glow': '0 0 20px hsl(var(--retro-earth-pink)), 0 0 40px hsl(var(--retro-earth-pink) / 0.3)',
        'coral-glow': '0 0 20px hsl(var(--retro-coral)), 0 0 40px hsl(var(--retro-coral) / 0.3)',
      },
      blur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // Enhanced plugin for organic retrowave utilities
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.text-glow': {
          textShadow: '0 0 15px currentColor, 0 0 30px currentColor',
        },
        '.text-glow-soft': {
          textShadow: '0 0 8px currentColor, 0 0 16px currentColor',
        },
        '.text-glow-bright': {
          textShadow: '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
        },
        '.border-glow': {
          boxShadow: '0 0 15px hsl(var(--retro-primary)), 0 0 30px hsl(var(--retro-primary) / 0.3)',
        },
        '.border-glow-earth': {
          boxShadow: '0 0 20px hsl(var(--retro-earth-pink)), 0 0 40px hsl(var(--retro-earth-pink) / 0.3)',
        },
        '.retrowave-card': {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'calc(var(--radius))',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px hsl(var(--border))',
          backdropFilter: 'blur(8px)',
        },
        '.synthwave-button': {
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          border: '1px solid hsl(var(--retro-primary))',
          borderRadius: 'calc(var(--radius))',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 20px hsl(var(--retro-primary)), 0 0 40px hsl(var(--retro-primary) / 0.4)',
            borderColor: 'hsl(var(--retro-primary))',
            transform: 'translateY(-1px)',
          },
        },
        '.gradient-text': {
          background: 'linear-gradient(135deg, hsl(var(--retro-primary)), hsl(var(--retro-sunset)))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.organic-flow': {
          borderRadius: '20px 8px 20px 8px',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
export default config
