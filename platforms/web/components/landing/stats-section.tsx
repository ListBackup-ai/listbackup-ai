'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  Users, 
  Database, 
  Globe,
  Zap,
  Award
} from 'lucide-react'

const achievements = [
  {
    icon: Award,
    title: "Enterprise Security Program",
    description: "Advanced security controls and monitoring",
    color: "text-blue-600",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: Globe,
    title: "Global Infrastructure",
    description: "Multi-region data centers worldwide",
    color: "text-green-600", 
    bgColor: "bg-green-500/10"
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description: "Instant data synchronization",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10"
  },
  {
    icon: Shield,
    title: "Zero Data Breaches",
    description: "Perfect security track record",
    color: "text-red-600",
    bgColor: "bg-red-500/10"
  }
]

const metrics = [
  {
    icon: Database,
    value: "50TB+",
    label: "Data Protected Daily",
    trend: "+125%",
    description: "Year-over-year growth",
    color: "text-blue-600"
  },
  {
    icon: Users,
    value: "10,000+",
    label: "Active Customers",
    trend: "+89%",
    description: "Customer growth rate",
    color: "text-green-600"
  },
  {
    icon: Clock,
    value: "99.98%",
    label: "Uptime Achievement",
    trend: "↗️",
    description: "Last 12 months",
    color: "text-purple-600"
  },
  {
    icon: TrendingUp,
    value: "$2.5M+",
    label: "Data Loss Prevented",
    trend: "+200%",
    description: "Value of recovered data",
    color: "text-orange-600"
  }
]

export function StatsSection() {
  return (
    <section className="py-24 bg-gradient-to-r from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
            📊 By the Numbers
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Proven Results, Trusted Performance
          </h2>
          <p className="text-lg text-muted-foreground">
            Our platform delivers measurable value and reliability that businesses depend on.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {metrics.map((metric, index) => (
            <Card 
              key={index} 
              className={`group hover:shadow-lg transition-all duration-300 hover-lift animate-fade-in-up border-0 bg-white/50 backdrop-blur-sm`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 ${metric.color === 'text-blue-600' ? 'bg-blue-500/10' : metric.color === 'text-green-600' ? 'bg-green-500/10' : metric.color === 'text-purple-600' ? 'bg-purple-500/10' : 'bg-orange-500/10'} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <metric.icon className={`w-8 h-8 ${metric.color}`} />
                </div>
                
                <div className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform">
                  {metric.value}
                </div>
                
                <div className="text-sm font-medium text-foreground mb-2">
                  {metric.label}
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-xs">
                  <span className="text-green-600 font-semibold">
                    {metric.trend}
                  </span>
                  <span className="text-muted-foreground">
                    {metric.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((achievement, index) => (
            <Card 
              key={index} 
              className={`group hover:shadow-lg transition-all duration-300 hover-lift animate-fade-in-up border-0`}
              style={{ animationDelay: `${(index + 4) * 150}ms` }}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 ${achievement.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <achievement.icon className={`w-6 h-6 ${achievement.color}`} />
                </div>
                
                <h3 className="font-semibold text-sm mb-2">
                  {achievement.title}
                </h3>
                
                <p className="text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}