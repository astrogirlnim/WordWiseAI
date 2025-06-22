'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { 
  Sparkles, 
  Target, 
  Users, 
  TrendingUp, 
  Zap, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight,
  PenTool,
  BarChart3,
  MessageSquare,
  Globe,
  Megaphone,
  BookOpen
} from 'lucide-react'

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleSubmit = async (values: z.infer<typeof signInSchema>) => {
    console.log('🔑 Sign-in form submitted:', { email: values.email })
    setLoading(true)
    setError('')

    try {
      await signIn(values.email, values.password)
      console.log('✅ Sign-in successful, redirecting to main app')
      router.push('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in'
      console.error('❌ Sign-in error:', error)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    console.log('🔑 Google sign-in initiated')
    try {
      await signInWithGoogle()
      console.log('✅ Google sign-in successful, redirecting to main app')
      router.push('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with Google'
      console.error('❌ Google sign-in error:', error)
      setError(message)
    }
  }

  const handleTryDemo = async () => {
    console.log('🎯 Try Demo clicked from landing page')
    try {
      // Redirect to demo mode
      router.push('/?demo=true')
    } catch (error) {
      console.error('❌ Error starting demo:', error)
      setError('Failed to start demo. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-retro-primary to-retro-sunset opacity-90" />
              <div className="relative z-10 h-4 w-4 rounded-full bg-white/90 shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-retro-primary to-retro-sunset bg-clip-text text-transparent">
                WordWise
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AI Assistant
              </span>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleTryDemo}
              className="hidden md:flex"
            >
              Try Demo
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Sign In</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Welcome Back</DialogTitle>
                  <DialogDescription>
                    Sign in to your WordWise AI account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {error && (
                        <div className="text-center text-sm text-red-600">{error}</div>
                      )}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                  >
                    Sign In with Google
                  </Button>
                  
                  <div className="text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link href="/sign-up" className="text-primary hover:underline">
                      Sign up
                    </Link>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-retro-primary to-retro-sunset hover:from-retro-primary/90 hover:to-retro-sunset/90">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-retro-primary/5 via-transparent to-retro-sunset/5" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
                              <Badge variant="outline" className="mb-6 border-retro-primary/20 text-retro-primary">
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI Writing Assistant for Sales Funnel Documentation
                </Badge>
              
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Transform Your Sales Funnels with{' '}
                <span className="bg-gradient-to-r from-retro-primary to-retro-sunset bg-clip-text text-transparent">
                  AI-Powered Copy
                </span>
              </h1>
              
                              <p className="mb-8 text-xl text-muted-foreground sm:text-2xl lg:max-w-3xl lg:mx-auto">
                  The AI writing assistant built specifically for sales funnel documentation. 
                  Create high-converting sales pages, landing pages, and email sequences with 
                  intelligent suggestions and real-time collaboration.
                </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/sign-up">
                                      <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-retro-primary to-retro-sunset hover:from-retro-primary/90 hover:to-retro-sunset/90 text-white font-semibold px-8 py-6 text-lg"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleTryDemo}
                  className="px-8 py-6 text-lg border-retro-primary/20 hover:border-retro-primary/40"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Try Demo - No Account Required
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time collaboration
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Unlimited AI suggestions
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Built for Sales Funnel Documentation
              </h2>
              <p className="text-xl text-muted-foreground">
                Every feature is designed to help you create compelling sales funnel content, 
                from landing pages to email sequences, with AI-powered writing assistance.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Conversion-Focused AI */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-retro-primary/10 p-2">
                      <Target className="h-6 w-6 text-retro-primary" />
                    </div>
                    <CardTitle className="text-lg">Conversion-Focused AI</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    AI suggestions prioritize conversion rate optimization over generic writing quality.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-primary" />
                      Psychological trigger detection
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-primary" />
                      CTA optimization suggestions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-primary" />
                      Urgency and scarcity enhancement
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Funnel Stage Awareness */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-retro-secondary/10 p-2">
                      <TrendingUp className="h-6 w-6 text-retro-secondary" />
                    </div>
                    <CardTitle className="text-lg">Funnel Stage Awareness</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    AI understands where each page fits in your sales funnel and adapts suggestions accordingly.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-secondary" />
                      Awareness → Interest → Conversion
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-secondary" />
                      Stage-appropriate messaging
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-secondary" />
                      Objection handling suggestions
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Real-Time Collaboration */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-retro-cyan/10 p-2">
                      <Users className="h-6 w-6 text-retro-cyan" />
                    </div>
                    <CardTitle className="text-lg">Real-Time Collaboration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Work together with your marketing team in real-time with live editing and comments.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-cyan" />
                      Live document editing
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-cyan" />
                      Team comments & feedback
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-cyan" />
                      Version history & control
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* A/B Testing Suggestions */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-retro-sunset/10 p-2">
                      <BarChart3 className="h-6 w-6 text-retro-sunset" />
                    </div>
                    <CardTitle className="text-lg">A/B Testing Ready</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Get variations and suggestions optimized for testing different approaches.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-sunset" />
                      Multiple headline variations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-sunset" />
                      CTA text alternatives
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-sunset" />
                      Copy positioning options
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Brand Voice Alignment */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-retro-accent/10 p-2">
                      <MessageSquare className="h-6 w-6 text-retro-accent" />
                    </div>
                    <CardTitle className="text-lg">Brand Voice Alignment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Maintain consistent brand voice across all your marketing materials and funnels.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-accent" />
                      Custom brand guidelines
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-accent" />
                      Tone alignment checking
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-retro-accent" />
                      Consistency reports
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Grammar & Style */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/10 p-2">
                      <PenTool className="h-6 w-6 text-green-500" />
                    </div>
                    <CardTitle className="text-lg">Advanced Grammar & Style</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Professional-grade grammar checking with marketing-specific style suggestions.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Real-time error detection
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Marketing writing style
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Readability optimization
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        <section className="py-20 lg:py-32 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Perfect for Sales Professionals
              </h2>
              <p className="text-xl text-muted-foreground">
                Whether you&apos;re creating individual sales documents or collaborating on team campaigns, WordWise AI streamlines your writing process.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-retro-primary/10">
                  <Megaphone className="h-8 w-8 text-retro-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Sales Managers</h3>
                <p className="text-muted-foreground">
                  Create compelling sales documentation and funnel content with AI assistance. 
                  Collaborate with your team on consistent messaging and effective sales copy.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-retro-secondary/10">
                  <PenTool className="h-8 w-8 text-retro-secondary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Sales Copywriters</h3>
                <p className="text-muted-foreground">
                  Write compelling sales pages, email sequences, and funnel content with AI-powered suggestions. 
                  Get real-time grammar checking and style improvements for professional sales copy.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-retro-cyan/10">
                  <TrendingUp className="h-8 w-8 text-retro-cyan" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Sales Teams</h3>
                <p className="text-muted-foreground">
                  Collaborate on sales funnel documentation with real-time editing and version control. 
                  Create consistent, professional sales materials with team input and AI assistance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Every Type of Sales Funnel Content
              </h2>
              <p className="text-xl text-muted-foreground">
                From landing pages to email sequences, WordWise AI helps you create professional sales documentation.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <Globe className="mb-3 h-8 w-8 text-retro-primary" />
                <h3 className="mb-2 font-semibold">Landing Pages</h3>
                <p className="text-sm text-muted-foreground">
                  Lead magnets, product sales, webinar registration pages
                </p>
              </div>

              <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <BookOpen className="mb-3 h-8 w-8 text-retro-secondary" />
                <h3 className="mb-2 font-semibold">Sales Pages</h3>
                <p className="text-sm text-muted-foreground">
                  Long-form sales letters, product descriptions, checkout pages
                </p>
              </div>

              <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <MessageSquare className="mb-3 h-8 w-8 text-retro-cyan" />
                <h3 className="mb-2 font-semibold">Email Sequences</h3>
                <p className="text-sm text-muted-foreground">
                  Welcome series, nurture campaigns, sales sequences
                </p>
              </div>

              <div className="rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <Zap className="mb-3 h-8 w-8 text-retro-sunset" />
                <h3 className="mb-2 font-semibold">Ad Copy</h3>
                <p className="text-sm text-muted-foreground">
                  Facebook/Google ads, social media copy, PPC campaigns
                </p>
              </div>
            </div>
          </div>
        </section>



        {/* CTA Section */}
        <section className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to Improve Your Sales Funnel Documentation?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Start creating professional sales content with AI-powered writing assistance and real-time collaboration.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center mb-8">
                <Link href="/sign-up">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-retro-primary to-retro-sunset hover:from-retro-primary/90 hover:to-retro-sunset/90 text-white font-semibold px-8 py-6 text-lg"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleTryDemo}
                  className="px-8 py-6 text-lg border-retro-primary/20 hover:border-retro-primary/40"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Try Demo First
                </Button>
              </div>

                              <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    Secure authentication
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    Quick setup process
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Free to use
                  </div>
                </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-retro-primary to-retro-sunset opacity-90" />
                  <div className="relative z-10 h-3 w-3 rounded-full bg-white/90 shadow-sm" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-retro-primary to-retro-sunset bg-clip-text text-transparent">
                  WordWise AI
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered writing assistant for sales funnel documentation with real-time collaboration and grammar checking.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={handleTryDemo} className="hover:text-foreground transition-colors">Demo</button></li>
                <li><Link href="/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link></li>
                <li><Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Conversion AI</li>
                <li>Funnel Optimization</li>
                <li>Real-time Collaboration</li>
                <li>Brand Voice Alignment</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Use Cases</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Landing Pages</li>
                <li>Sales Pages</li>
                <li>Email Marketing</li>
                <li>Ad Copy</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 WordWise AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
