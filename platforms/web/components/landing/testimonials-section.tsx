'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const testimonials = [
  {
    quote: "ListBackup.ai saved our business when our CRM crashed. We recovered 50,000 contacts in minutes instead of weeks.",
    author: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechStart Solutions",
    avatar: "SJ",
    industry: "SaaS",
    rating: 5,
    metric: "50,000 contacts recovered"
  },
  {
    quote: "The migration from Keap to HubSpot was seamless. Their export features are incredible.",
    author: "Mike Chen", 
    role: "Operations Manager",
    company: "Growth Agency Pro",
    avatar: "MC",
    industry: "Marketing Agency",
    rating: 5,
    metric: "Seamless migration"
  },
  {
    quote: "We've been using ListBackup.ai for 18 months. The peace of mind is worth every penny.",
    author: "Lisa Rodriguez",
    role: "CEO",
    company: "E-commerce Plus",
    avatar: "LR",
    industry: "E-commerce",
    rating: 5,
    metric: "18 months of uptime"
  },
  {
    quote: "Their Stripe backup caught a data discrepancy that saved us $50,000 in incorrect refunds.",
    author: "David Kim",
    role: "CFO", 
    company: "FinTech Innovations",
    avatar: "DK",
    industry: "FinTech",
    rating: 5,
    metric: "$50K saved"
  },
  {
    quote: "Real-time sync means our data is always protected. No more sleepless nights worrying about backups.",
    author: "Emma Watson",
    role: "IT Director",
    company: "Healthcare Partners",
    avatar: "EW", 
    industry: "Healthcare",
    rating: 5,
    metric: "Real-time protection"
  },
  {
    quote: "The comprehensive security features helped us meet all our compliance requirements.",
    author: "James Wilson",
    role: "Security Lead",
    company: "Enterprise Corp",
    avatar: "JW",
    industry: "Enterprise",
    rating: 5,
    metric: "Compliance ready"
  }
]

const stats = [
  { value: "10,000+", label: "Businesses Protected" },
  { value: "50TB+", label: "Data Backed Up Daily" },
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "24/7", label: "Support & Monitoring" }
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
            ⭐ Customer Stories
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Trusted by <span className="gradient-text">10,000+</span> Businesses Worldwide
          </h2>
          <p className="text-lg text-muted-foreground">
            From startups to Fortune 500 companies, see how ListBackup.ai protects critical business data.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className={`group hover:shadow-lg transition-all duration-300 hover-lift animate-fade-in-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-sm mb-6 text-muted-foreground leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.author}</div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {testimonial.industry}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Metric */}
                  <div className="text-right">
                    <div className="text-xs font-semibold text-primary">
                      {testimonial.metric}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-2">
                Join Thousands of Happy Customers
              </h3>
              <p className="text-muted-foreground mb-6">
                Start protecting your business data today with our 14-day free trial.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">
                    Schedule Demo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}