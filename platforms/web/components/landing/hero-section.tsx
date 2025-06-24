'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Shield, Zap, Cloud } from 'lucide-react'
import { useState } from 'react'

interface HeroSectionProps {
  badge?: string
  title: string
  subtitle: string
  description: string
  primaryCTA?: {
    text: string
    href: string
  }
  secondaryCTA?: {
    text: string
    href: string
  }
  features?: string[]
  showVideo?: boolean
  gradient?: 'default' | 'blue' | 'purple' | 'green'
}

const gradients = {
  default: 'from-primary/20 via-primary/10 to-transparent',
  blue: 'from-blue-500/20 via-blue-500/10 to-transparent',
  purple: 'from-purple-500/20 via-purple-500/10 to-transparent',
  green: 'from-green-500/20 via-green-500/10 to-transparent',
}

export function HeroSection({
  badge,
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  features,
  showVideo = false,
  gradient = 'default'
}: HeroSectionProps) {
  const [videoPlaying, setVideoPlaying] = useState(false)

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Animated gradient orb */}
      <div className={`absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br ${gradients[gradient]} blur-3xl animate-pulse`} />
      <div className={`absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr ${gradients[gradient]} blur-3xl animate-pulse animation-delay-2000`} />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          {badge && (
            <div className="animate-fade-in-down">
              <Badge className="mb-4 px-4 py-1 text-sm bg-primary/10 text-primary border-primary/20">
                {badge}
              </Badge>
            </div>
          )}

          {/* Title */}
          <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up animation-delay-200 mt-4 text-xl sm:text-2xl md:text-3xl font-semibold text-primary">
            {subtitle}
          </p>

          {/* Description */}
          <p className="animate-fade-in-up animation-delay-400 mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            {description}
          </p>

          {/* Social Proof */}
          <div className="animate-fade-in-up animation-delay-500 mt-6 flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background" />
                ))}
              </div>
              <span>10,000+ users trust us</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span>4.9/5 rating</span>
            </div>
          </div>

          {/* Features */}
          {features && features.length > 0 && (
            <div className="animate-fade-in-up animation-delay-600 mt-8 flex flex-wrap justify-center gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="animate-fade-in-up animation-delay-800 mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {primaryCTA && (
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 pulse"
                asChild
              >
                <Link href={primaryCTA.href}>
                  <span className="relative z-10 flex items-center gap-2">
                    {primaryCTA.text}
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>
            )}
            {secondaryCTA && (
              <Button 
                size="lg" 
                variant="outline" 
                className="group border-2 hover:bg-primary/5"
                asChild
              >
                <Link href={secondaryCTA.href}>
                  <span className="flex items-center gap-2">
                    {showVideo ? <Play className="w-5 h-5" /> : null}
                    {secondaryCTA.text}
                  </span>
                </Link>
              </Button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-in-up animation-delay-900 mt-8 text-xs text-muted-foreground">
            <p>✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime</p>
          </div>
        </div>

        {/* Optional video section */}
        {showVideo && (
          <div className="animate-fade-in-up animation-delay-1000 mt-16 mx-auto max-w-5xl">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-muted/50 backdrop-blur">
              <div className="aspect-video flex items-center justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="group"
                  onClick={() => setVideoPlaying(true)}
                >
                  <Play className="w-8 h-8 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}