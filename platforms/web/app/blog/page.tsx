import { LandingLayout } from '@/components/landing/layout'
import { HeroSection } from '@/components/landing/hero-section'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  User, 
  ArrowRight, 
  Search,
  Clock,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const featuredPost = {
  title: "The Complete Guide to Business Data Backup in 2024",
  excerpt: "Everything you need to know about protecting your business data, from choosing the right backup strategy to implementing automated solutions.",
  author: "Sarah Johnson",
  date: "December 14, 2024",
  readTime: "8 min read",
  category: "Best Practices",
  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
  featured: true
}

const recentPosts = [
  {
    title: "How to Migrate from Keap to HubSpot Without Losing Data",
    excerpt: "Step-by-step guide to seamlessly migrating your CRM data with zero downtime.",
    author: "Mike Chen",
    date: "December 12, 2024", 
    readTime: "5 min read",
    category: "Migration",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop"
  },
  {
    title: "GDPR Compliance for SaaS Companies: A Data Backup Perspective",
    excerpt: "Understanding how proper data backup strategies help maintain GDPR compliance.",
    author: "Emma Watson",
    date: "December 10, 2024",
    readTime: "6 min read", 
    category: "Compliance",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop"
  },
  {
    title: "5 Critical Mistakes in Stripe Data Management",
    excerpt: "Common pitfalls when handling payment data and how to avoid them.",
    author: "David Kim",
    date: "December 8, 2024",
    readTime: "4 min read",
    category: "Payments",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop"
  },
  {
    title: "Real-time Data Sync: Why It Matters for Modern Businesses",
    excerpt: "The importance of instant data synchronization in today's fast-paced business environment.",
    author: "Lisa Rodriguez", 
    date: "December 6, 2024",
    readTime: "7 min read",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop"
  },
  {
    title: "Building a Disaster Recovery Plan for Your SaaS Business",
    excerpt: "Essential steps to create a comprehensive disaster recovery strategy.",
    author: "James Wilson",
    date: "December 4, 2024",
    readTime: "10 min read",
    category: "Planning",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop"
  },
  {
    title: "The ROI of Automated Data Backups",
    excerpt: "Calculating the true value and cost savings of implementing automated backup solutions.",
    author: "Sarah Johnson",
    date: "December 2, 2024",
    readTime: "6 min read",
    category: "Business",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop"
  }
]

const categories = ["All", "Best Practices", "Migration", "Compliance", "Payments", "Technology", "Planning", "Business"]

export default function BlogPage() {
  return (
    <LandingLayout>
      <HeroSection
        badge="📚 Knowledge Hub"
        title="Data Protection Insights & Best Practices"
        subtitle="Expert Guidance for Modern Businesses"
        description="Stay informed with the latest trends, best practices, and expert insights on data backup, compliance, and business continuity."
        primaryCTA={{
          text: "Start Free Trial",
          href: "/signup"
        }}
        secondaryCTA={{
          text: "Subscribe to Updates",
          href: "#newsletter"
        }}
        gradient="green"
      />

      {/* Search and Categories */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search articles..."
                className="pl-10 h-12"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 px-4 py-1 bg-primary/10 text-primary border-primary/20">
                Featured Article
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Latest Insights</h2>
            </div>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="relative h-64 md:h-full">
                    <Image
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="md:w-1/2 p-8">
                  <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                    {featuredPost.category}
                  </Badge>
                  <h3 className="text-2xl font-bold mb-4 hover:text-primary transition-colors">
                    <Link href={`/blog/${featuredPost.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                      {featuredPost.title}
                    </Link>
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{featuredPost.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{featuredPost.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{featuredPost.readTime}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${featuredPost.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Recent Articles</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map((post, index) => (
                <Card key={index} className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover-lift">
                  <div className="relative h-48">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-primary">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      <Link href={`/blog/${post.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <span>{post.author}</span>
                        <span>{post.date}</span>
                      </div>
                      <span>{post.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                View All Articles
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section id="newsletter" className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-r from-primary to-primary/80 border-0 text-white">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Stay Updated with Data Protection Insights
                </h2>
                <p className="text-white/90 mb-6">
                  Get the latest articles, best practices, and industry news delivered to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <Input
                    placeholder="Enter your email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
                  />
                  <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    Subscribe
                  </Button>
                </div>
                <p className="text-xs text-white/70 mt-4">
                  No spam. Unsubscribe anytime.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </LandingLayout>
  )
}