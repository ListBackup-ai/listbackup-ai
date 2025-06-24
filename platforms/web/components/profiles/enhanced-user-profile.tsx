"use client"

import React, { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap,
  Star,
  Award,
  Activity,
  Settings,
  Edit3,
  Save,
  X,
  Plus,
  Badge as BadgeIcon,
  Globe,
  Github,
  Linkedin,
  Twitter
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EntityTagging } from '@/components/tags/entity-tagging'
import { TagDisplay } from '@/components/ui/tag-display'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface EnhancedUserProfileProps {
  userId: string
  editable?: boolean
  compact?: boolean
  className?: string
}

interface UserProfile {
  userId: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  title?: string
  department?: string
  bio?: string
  location?: string
  timezone?: string
  phone?: string
  
  // Professional Information
  experience?: {
    company: string
    position: string
    startDate: string
    endDate?: string
    description?: string
  }[]
  
  education?: {
    institution: string
    degree: string
    field: string
    graduationYear: string
  }[]
  
  skills?: {
    name: string
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    verified?: boolean
  }[]
  
  certifications?: {
    name: string
    issuer: string
    issueDate: string
    expiryDate?: string
    credentialId?: string
  }[]
  
  // Social Links
  socialLinks?: {
    platform: 'github' | 'linkedin' | 'twitter' | 'website'
    url: string
  }[]
  
  // Preferences
  preferences?: {
    theme: 'light' | 'dark' | 'system'
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    privacy: {
      showEmail: boolean
      showPhone: boolean
      showLocation: boolean
    }
  }
  
  // Activity
  lastActive?: string
  joinDate: string
  stats?: {
    totalSources: number
    totalJobs: number
    totalBackups: number
    storageUsed: number
  }
}

// Mock data - in real app this would come from API
const mockProfile: UserProfile = {
  userId: 'user-123',
  email: 'john.doe@company.com',
  firstName: 'John',
  lastName: 'Doe',
  avatar: '/api/placeholder/150/150',
  title: 'Senior DevOps Engineer',
  department: 'Engineering',
  bio: 'Passionate about automation, cloud infrastructure, and data backup solutions. 5+ years of experience in DevOps and system administration.',
  location: 'San Francisco, CA',
  timezone: 'America/Los_Angeles',
  phone: '+1 (555) 123-4567',
  
  experience: [
    {
      company: 'TechCorp Inc.',
      position: 'Senior DevOps Engineer',
      startDate: '2022-01',
      description: 'Leading infrastructure automation and backup strategies'
    },
    {
      company: 'StartupXYZ',
      position: 'DevOps Engineer',
      startDate: '2020-03',
      endDate: '2021-12',
      description: 'Built CI/CD pipelines and monitoring systems'
    }
  ],
  
  education: [
    {
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      graduationYear: '2019'
    }
  ],
  
  skills: [
    { name: 'AWS', level: 'expert', verified: true },
    { name: 'Docker', level: 'advanced', verified: true },
    { name: 'Kubernetes', level: 'advanced', verified: false },
    { name: 'Terraform', level: 'intermediate', verified: true },
    { name: 'Python', level: 'advanced', verified: false },
  ],
  
  certifications: [
    {
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: '2023-01',
      credentialId: 'AWS-SA-12345'
    }
  ],
  
  socialLinks: [
    { platform: 'github', url: 'https://github.com/johndoe' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
    { platform: 'website', url: 'https://johndoe.dev' }
  ],
  
  lastActive: '2024-06-20T10:30:00Z',
  joinDate: '2023-01-15T08:00:00Z',
  
  stats: {
    totalSources: 12,
    totalJobs: 8,
    totalBackups: 156,
    storageUsed: 2.4 * 1024 * 1024 * 1024 // 2.4 GB
  }
}

export function EnhancedUserProfile({
  userId,
  editable = false,
  compact = false,
  className,
}: EnhancedUserProfileProps) {
  const [profile, setProfile] = useState<UserProfile>(mockProfile)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getSkillColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-green-500'
      case 'advanced': return 'bg-blue-500'
      case 'intermediate': return 'bg-yellow-500'
      case 'beginner': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getSkillProgress = (level: string) => {
    switch (level) {
      case 'expert': return 95
      case 'advanced': return 75
      case 'intermediate': return 50
      case 'beginner': return 25
      default: return 0
    }
  }

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'github': return <Github className="h-4 w-4" />
      case 'linkedin': return <Linkedin className="h-4 w-4" />
      case 'twitter': return <Twitter className="h-4 w-4" />
      case 'website': return <Globe className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} />
              <AvatarFallback>
                {profile.firstName[0]}{profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">
                {profile.firstName} {profile.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{profile.title}</p>
              <div className="mt-2">
                <EntityTagging
                  entityId={userId}
                  entityType="user"
                  editable={editable}
                  compact={true}
                  showTitle={false}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} />
                <AvatarFallback className="text-2xl">
                  {profile.firstName[0]}{profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="text-lg text-muted-foreground">{profile.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.department} • {profile.location}
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span>Active {new Date(profile.lastActive!).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {editable && (
              <Button
                variant={editing ? "outline" : "default"}
                onClick={() => setEditing(!editing)}
              >
                {editing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            )}
          </div>

          {profile.bio && (
            <div className="mt-4">
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          {/* Social Links */}
          {profile.socialLinks && profile.socialLinks.length > 0 && (
            <div className="flex items-center space-x-2 mt-4">
              {profile.socialLinks.map((link, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => window.open(link.url, '_blank')}
                >
                  {getSocialIcon(link.platform)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.stats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{profile.stats.totalSources}</p>
                      <p className="text-xs text-muted-foreground">Sources</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{profile.stats.totalJobs}</p>
                      <p className="text-xs text-muted-foreground">Jobs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{profile.stats.totalBackups}</p>
                      <p className="text-xs text-muted-foreground">Backups</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatBytes(profile.stats.storageUsed)}</p>
                      <p className="text-xs text-muted-foreground">Storage</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-full justify-start">
                    <BadgeIcon className="h-3 w-3 mr-2" />
                    First Backup Created
                  </Badge>
                  <Badge variant="secondary" className="w-full justify-start">
                    <Award className="h-3 w-3 mr-2" />
                    Data Guardian
                  </Badge>
                  <Badge variant="secondary" className="w-full justify-start">
                    <Star className="h-3 w-3 mr-2" />
                    Power User
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="experience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.experience && profile.experience.length > 0 ? (
                  <div className="space-y-4">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-muted pl-4">
                        <h4 className="font-semibold">{exp.position}</h4>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        <p className="text-xs text-muted-foreground">
                          {exp.startDate} - {exp.endDate || 'Present'}
                        </p>
                        {exp.description && (
                          <p className="text-sm mt-2">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No work experience added
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.education && profile.education.length > 0 ? (
                  <div className="space-y-4">
                    {profile.education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-muted pl-4">
                        <h4 className="font-semibold">{edu.degree} in {edu.field}</h4>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        <p className="text-xs text-muted-foreground">
                          Graduated {edu.graduationYear}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No education information added
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.certifications && profile.certifications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.certifications.map((cert, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{cert.name}</h4>
                      <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {cert.issueDate}
                        {cert.expiryDate && ` • Expires: ${cert.expiryDate}`}
                      </p>
                      {cert.credentialId && (
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          ID: {cert.credentialId}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No certifications added
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>
                Technical skills and proficiency levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="space-y-4">
                  {profile.skills.map((skill, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{skill.name}</span>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", skill.verified && "border-green-500 text-green-700")}
                          >
                            {skill.level}
                            {skill.verified && <Award className="h-3 w-3 ml-1" />}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={cn("h-2 rounded-full", getSkillColor(skill.level))}
                          style={{ width: `${getSkillProgress(skill.level)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No skills added yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <EntityTagging
            entityId={userId}
            entityType="user"
            editable={editable}
            compact={false}
            showTitle={true}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {editable && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Privacy Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control what information is visible to others
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-email">Show Email Address</Label>
                    <Switch id="show-email" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-phone">Show Phone Number</Label>
                    <Switch id="show-phone" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-location">Show Location</Label>
                    <Switch id="show-location" />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <Switch id="email-notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <Switch id="push-notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <Switch id="sms-notifications" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}