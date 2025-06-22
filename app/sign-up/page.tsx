'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  CheckCircle,
  ArrowRight
} from 'lucide-react'

const signUpSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp, signInWithGoogle } = useAuth()
  const router = useRouter()

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const handleSubmit = async (values: z.infer<typeof signUpSchema>) => {
    console.log('🚀 Sign-up form submitted:', { email: values.email })
    setLoading(true)
    setError('')

    try {
      await signUp(values.email, values.password)
      console.log('✅ Sign-up successful, redirecting to main app')
      router.push('/')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create account'
      console.error('❌ Sign-up error:', error)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    console.log('🔑 Google sign-up initiated')
    try {
      await signInWithGoogle()
      console.log('✅ Google sign-up successful, redirecting to main app')
      router.push('/')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to sign up with Google'
      console.error('❌ Google sign-up error:', error)
      setError(message)
    }
  }

  const handleTryDemo = async () => {
    console.log('🎯 Try Demo clicked from sign-up page')
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
          <Link href="/sign-in" className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-retro-primary to-retro-sunset opacity-90" />
              <div className="relative z-10 h-4 w-4 rounded-full bg-white/90 shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-retro-primary to-retro-sunset bg-clip-text text-transparent">
                FunnelFluent
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AI Assistant
              </span>
            </div>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleTryDemo}
              className="hidden md:flex"
            >
              Try Demo
            </Button>
            
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with Sign-Up Form */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-retro-primary/5 via-transparent to-retro-sunset/5" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                
                {/* Left Column - Value Proposition */}
                <div className="text-center lg:text-left">
                  <Badge variant="outline" className="mb-6 border-retro-primary/20 text-retro-primary">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Start Free - No Credit Card Required
                  </Badge>
                  
                  <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                    Join{' '}
                    <span className="bg-gradient-to-r from-retro-primary to-retro-sunset bg-clip-text text-transparent">
                      FunnelFluent AI
                    </span>
                  </h1>
                  
                  <p className="mb-2 text-lg text-muted-foreground font-medium italic">
                    Where sales copy meets AI brilliance
                  </p>
                  
                  <p className="mb-8 text-xl text-muted-foreground">
                    Create high-converting sales funnel documentation with AI-powered writing assistance. 
                    Join thousands of sales professionals already using FunnelFluent AI.
                  </p>

                  <div className="flex flex-wrap gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Free to use forever
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      AI writing suggestions
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Dynamic document sharing
                    </div>
                  </div>
                </div>

                {/* Right Column - Sign-Up Form */}
                <div className="mx-auto w-full max-w-md">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
                      <CardDescription>
                        Start creating professional sales funnel content with AI assistance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                <FormLabel>Email Address</FormLabel>
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
                                  <Input
                                    type="password"
                                    placeholder="Create a secure password"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Confirm your password"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {error && (
                            <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                              {error}
                            </div>
                          )}
                          
                          <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-retro-primary to-retro-sunset hover:from-retro-primary/90 hover:to-retro-sunset/90 text-white font-semibold py-6 text-lg" 
                            disabled={loading}
                            size="lg"
                          >
                            {loading ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Creating Account...
                              </>
                            ) : (
                              <>
                                Create Free Account
                                <ArrowRight className="ml-2 h-5 w-5" />
                              </>
                            )}
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
                        className="w-full py-6 text-lg"
                        onClick={handleGoogleSignUp}
                        size="lg"
                      >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign Up with Google
                      </Button>
                      
                      <div className="text-center text-sm">
                        Already have an account?{' '}
                        <Link href="/sign-in" className="text-retro-primary hover:underline font-medium">
                          Sign in here
                        </Link>
                      </div>

                      <div className="text-xs text-muted-foreground text-center pt-2">
                        By signing up, you agree to our Terms of Service and Privacy Policy
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 lg:py-32 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Why Sales Professionals Choose FunnelFluent AI
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of sales teams creating high-converting content with AI assistance
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Sales-Focused AI */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-retro-primary/10 p-2">
                      <Target className="h-6 w-6 text-retro-primary" />
                    </div>
                    <CardTitle className="text-lg">Sales-Focused AI</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    AI suggestions tailored specifically for sales funnel content, marketing copy, and conversion optimization.
                  </p>
                </CardContent>
              </Card>

              {/* Dynamic Sharing */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-retro-cyan/10 p-2">
                      <Users className="h-6 w-6 text-retro-cyan" />
                    </div>
                    <CardTitle className="text-lg">Team Collaboration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Share documents instantly with secure links. Collaborate with your team on sales campaigns seamlessly.
                  </p>
                </CardContent>
              </Card>

              {/* Version Control */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-retro-secondary/10 p-2">
                      <TrendingUp className="h-6 w-6 text-retro-secondary" />
                    </div>
                    <CardTitle className="text-lg">Version Control</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track all changes with comprehensive version history. Compare iterations and restore previous versions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8">
                Get Started in Minutes
              </h2>
              
              <div className="grid gap-8 sm:grid-cols-3 mb-12">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-retro-primary/10">
                    <span className="text-xl font-bold text-retro-primary">1</span>
                  </div>
                  <h3 className="mb-2 font-semibold">Sign Up Free</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your account in seconds. No credit card required.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-retro-secondary/10">
                    <span className="text-xl font-bold text-retro-secondary">2</span>
                  </div>
                  <h3 className="mb-2 font-semibold">Create Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Start writing your sales funnel content with AI assistance.
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-retro-cyan/10">
                    <span className="text-xl font-bold text-retro-cyan">3</span>
                  </div>
                  <h3 className="mb-2 font-semibold">Share & Collaborate</h3>
                  <p className="text-sm text-muted-foreground">
                    Share with your team and collaborate on campaigns.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button 
                  size="lg" 
                  onClick={handleTryDemo}
                  variant="outline"
                  className="px-8 py-6 text-lg border-retro-primary/20 hover:border-retro-primary/40"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Try Demo First
                </Button>
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
                  FunnelFluent AI
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered writing assistant for sales funnel documentation with dynamic sharing and advanced grammar checking.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={handleTryDemo} className="hover:text-foreground transition-colors">Demo</button></li>
                <li><Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li>
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="hover:text-foreground transition-colors"
                  >
                    Sign Up
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Sales-Focused AI</li>
                <li>Version Control</li>
                <li>Document Sharing</li>
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
            <p>&copy; 2024 FunnelFluent AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
