import type React from 'react'
import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'WordWise AI - Professional AI Writing Assistant',
  description:
    'Professional AI-powered writing assistant with retro tech aesthetics - Perfect for marketing professionals and content creators',
  generator: 'WordWise AI',
  keywords: ['AI writing', 'professional writing', 'content creation', 'writing assistant', 'retro tech'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
