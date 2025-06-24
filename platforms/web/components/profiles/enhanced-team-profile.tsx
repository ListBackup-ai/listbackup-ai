"use client"

import React, { useState } from 'react'
import { 
  Users, 
  UserPlus, 
  Crown, 
  Mail, 
  Calendar, 
  Target, 
  Activity,
  Settings,
  Edit3,
  Save,
  X,
  Plus,
  TrendingUp,
  Award,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  BarChart3,
  PieChart,
  MapPin,
  Briefcase,
  Globe,
  Phone
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
import { Progress } from '@/components/ui/progress'
import { EntityTagging } from '@/components/tags/entity-tagging'
import { TagDisplay } from '@/components/ui/tag-display'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface EnhancedTeamProfileProps {
  teamId: string
  editable?: boolean
  compact?: boolean
  className?: string
}

interface TeamMember {
  userId: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  title?: string
  joinedAt: string
  lastActive?: string
  permissions?: string[]
}

interface TeamProject {
  projectId: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'paused' | 'planning'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate: string
  endDate?: string
  progress: number
  assignedMembers: string[]
}

interface TeamProfile {
  teamId: string
  name: string
  description?: string
  avatar?: string
  accountId: string
  
  // Team Information
  type: 'department' | 'project' | 'cross-functional' | 'temporary'
  department?: string
  location?: string
  timezone?: string
  
  // Contact Information
  contactInfo?: {
    email?: string
    phone?: string
    slackChannel?: string
    teamsChannel?: string
  }
  
  // Members
  members: TeamMember[]
  memberLimit?: number
  
  // Projects & Goals
  projects?: TeamProject[]
  goals?: {
    goalId: string
    title: string
    description?: string
    targetDate: string
    progress: number
    status: 'active' | 'completed' | 'overdue'
  }[]
  
  // KPIs & Metrics
  kpis?: {
    name: string
    value: number
    target: number
    unit: string
    trend: 'up' | 'down' | 'stable'
  }[]
  
  // Skills & Expertise
  skillMatrix?: {
    skill: string
    members: {
      userId: string
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    }[]
  }[]
  
  // Communication Preferences
  communication?: {
    preferredChannels: ('email' | 'slack' | 'teams' | 'discord')[]
    meetingCadence: 'daily' | 'weekly' | 'biweekly' | 'monthly'
    timeZone: string
    workingHours: {
      start: string
      end: string
      timezone: string
    }
  }
  
  // Statistics
  stats?: {
    totalProjects: number
    completedProjects: number
    activeSources: number
    totalBackups: number
    storageUsed: number
    lastActivity: string
  }
  
  // Dates
  createdAt: string
  updatedAt: string
}

// Mock data - in real app this would come from API
const mockTeamProfile: TeamProfile = {
  teamId: 'team-123',
  name: 'DevOps Engineering',
  description: 'Responsible for infrastructure automation, backup strategies, and system reliability across all platforms.',
  avatar: '/api/placeholder/100/100',
  accountId: 'acc-123',
  type: 'department',
  department: 'Engineering',
  location: 'San Francisco, CA',
  timezone: 'America/Los_Angeles',
  
  contactInfo: {
    email: 'devops@company.com',
    slackChannel: '#devops-team',
    teamsChannel: 'DevOps Team'
  },
  
  members: [
    {
      userId: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      avatar: '/api/placeholder/40/40',
      role: 'owner',
      title: 'DevOps Team Lead',
      joinedAt: '2023-01-15T08:00:00Z',
      lastActive: '2024-06-20T10:30:00Z'
    },
    {
      userId: 'user-2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@company.com',
      avatar: '/api/placeholder/40/40',
      role: 'admin',
      title: 'Senior DevOps Engineer',
      joinedAt: '2023-02-01T08:00:00Z',
      lastActive: '2024-06-20T09:15:00Z'
    },
    {
      userId: 'user-3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@company.com',
      role: 'member',
      title: 'DevOps Engineer',
      joinedAt: '2023-06-15T08:00:00Z',
      lastActive: '2024-06-19T16:45:00Z'
    }
  ],
  
  projects: [
    {
      projectId: 'proj-1',
      name: 'Infrastructure Modernization',
      description: 'Migrate legacy systems to cloud-native architecture',
      status: 'active',
      priority: 'high',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      progress: 65,
      assignedMembers: ['user-1', 'user-2', 'user-3']
    },
    {
      projectId: 'proj-2',
      name: 'Backup Strategy Overhaul',
      description: 'Implement new backup and disaster recovery procedures',
      status: 'active',
      priority: 'urgent',
      startDate: '2024-03-01',
      endDate: '2024-08-31',
      progress: 40,
      assignedMembers: ['user-1', 'user-2']
    }
  ],
  
  goals: [
    {
      goalId: 'goal-1',
      title: '99.9% Uptime Achievement',
      description: 'Maintain system uptime above 99.9% for Q3',
      targetDate: '2024-09-30',
      progress: 85,
      status: 'active'
    },
    {
      goalId: 'goal-2',
      title: 'Reduce Backup Time by 50%',
      targetDate: '2024-07-31',
      progress: 30,
      status: 'active'
    }
  ],
  
  kpis: [
    { name: 'System Uptime', value: 99.95, target: 99.9, unit: '%', trend: 'up' },
    { name: 'Deployment Frequency', value: 24, target: 20, unit: 'per month', trend: 'up' },
    { name: 'Mean Time to Recovery', value: 45, target: 60, unit: 'minutes', trend: 'down' },
    { name: 'Failed Backups', value: 2, target: 5, unit: '%', trend: 'down' }
  ],
  
  skillMatrix: [
    {
      skill: 'AWS',
      members: [
        { userId: 'user-1', level: 'expert' },
        { userId: 'user-2', level: 'advanced' },
        { userId: 'user-3', level: 'intermediate' }
      ]
    },
    {
      skill: 'Kubernetes',
      members: [
        { userId: 'user-1', level: 'advanced' },
        { userId: 'user-2', level: 'expert' },
        { userId: 'user-3', level: 'beginner' }
      ]
    }
  ],
  
  communication: {
    preferredChannels: ['slack', 'email'],
    meetingCadence: 'weekly',
    timeZone: 'America/Los_Angeles',
    workingHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'America/Los_Angeles'
    }
  },
  
  stats: {
    totalProjects: 12,
    completedProjects: 8,
    activeSources: 45,
    totalBackups: 250,
    storageUsed: 15.6 * 1024 * 1024 * 1024, // 15.6 GB
    lastActivity: '2024-06-20T10:30:00Z'
  },
  
  createdAt: '2023-01-15T08:00:00Z',
  updatedAt: '2024-06-20T10:30:00Z'
}

export function EnhancedTeamProfile({
  teamId,
  editable = false,
  compact = false,
  className,
}: EnhancedTeamProfileProps) {
  const [profile, setProfile] = useState<TeamProfile>(mockTeamProfile)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin': return <Star className="h-4 w-4 text-blue-500" />
      default: return <Users className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'member': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'planning': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
      default: return <div className="h-3 w-3" />
    }
  }

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback>
                <Users className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.members.length} members</p>
              <div className="mt-2">
                <EntityTagging
                  entityId={teamId}
                  entityType="team"
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
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  <Users className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-lg text-muted-foreground capitalize">{profile.type} Team</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">
                      {profile.members.length} members
                    </Badge>
                    <Badge variant="outline">
                      {profile.department}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
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
                    Edit Team
                  </>
                )}
              </Button>
            )}
          </div>

          {profile.description && (
            <div className="mt-4">
              <p className="text-muted-foreground">{profile.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Team Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.stats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{profile.stats.totalProjects}</p>
                      <p className="text-xs text-muted-foreground">Total Projects</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{profile.stats.completedProjects}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{profile.stats.activeSources}</p>
                      <p className="text-xs text-muted-foreground">Active Sources</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatBytes(profile.stats.storageUsed)}</p>
                      <p className="text-xs text-muted-foreground">Storage Used</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Current Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.goals && profile.goals.length > 0 ? (
                  <div className="space-y-4">
                    {profile.goals.slice(0, 3).map((goal) => (
                      <div key={goal.goalId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{goal.title}</h4>
                          <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No active goals
                  </p>
                )}
              </CardContent>
            </Card>

            {/* KPIs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.kpis && profile.kpis.length > 0 ? (
                  <div className="space-y-3">
                    {profile.kpis.map((kpi, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{kpi.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Target: {kpi.target}{kpi.unit}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold">
                            {kpi.value}{kpi.unit}
                          </span>
                          {getTrendIcon(kpi.trend)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No KPIs defined
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {profile.contactInfo?.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.contactInfo.email}</span>
                  </div>
                )}
                {profile.contactInfo?.slackChannel && (
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.contactInfo.slackChannel}</span>
                  </div>
                )}
                {profile.communication?.meetingCadence && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{profile.communication.meetingCadence} meetings</span>
                  </div>
                )}
                {profile.communication?.workingHours && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {profile.communication.workingHours.start} - {profile.communication.workingHours.end}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage team members and their roles
                  </CardDescription>
                </div>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={`${member.firstName} ${member.lastName}`} />
                        <AvatarFallback>
                          {member.firstName[0]}{member.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{member.firstName} {member.lastName}</h4>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.title || member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {member.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Projects</CardTitle>
                  <CardDescription>
                    Current and completed projects
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profile.projects && profile.projects.length > 0 ? (
                <div className="space-y-4">
                  {profile.projects.map((project) => (
                    <Card key={project.projectId}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{project.name}</h4>
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getProjectStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                            <Badge className={getPriorityColor(project.priority)}>
                              {project.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>
                            {new Date(project.startDate).toLocaleDateString()}
                            {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                          </span>
                          <span>{project.assignedMembers.length} members assigned</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Projects</h3>
                  <p className="text-muted-foreground">
                    Start by creating your first team project
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Skills Matrix</CardTitle>
              <CardDescription>
                Overview of team expertise and skill distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.skillMatrix && profile.skillMatrix.length > 0 ? (
                <div className="space-y-6">
                  {profile.skillMatrix.map((skillGroup, index) => (
                    <div key={index}>
                      <h4 className="font-medium mb-3">{skillGroup.skill}</h4>
                      <div className="space-y-2">
                        {skillGroup.members.map((memberSkill) => {
                          const member = profile.members.find(m => m.userId === memberSkill.userId)
                          return (
                            <div key={memberSkill.userId} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member?.avatar} alt={`${member?.firstName} ${member?.lastName}`} />
                                  <AvatarFallback className="text-xs">
                                    {member?.firstName?.[0]}{member?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{member?.firstName} {member?.lastName}</span>
                              </div>
                              <Badge 
                                className={cn(
                                  "text-white",
                                  memberSkill.level === 'expert' && "bg-green-500",
                                  memberSkill.level === 'advanced' && "bg-blue-500",
                                  memberSkill.level === 'intermediate' && "bg-yellow-500",
                                  memberSkill.level === 'beginner' && "bg-gray-500"
                                )}
                              >
                                {memberSkill.level}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Skills Matrix</h3>
                  <p className="text-muted-foreground">
                    Define team skills and member expertise levels
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <EntityTagging
            entityId={teamId}
            entityType="team"
            editable={editable}
            compact={false}
            showTitle={true}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {editable && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Settings</CardTitle>
                  <CardDescription>
                    Configure team preferences and policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input id="team-name" value={profile.name} />
                  </div>
                  <div>
                    <Label htmlFor="team-description">Description</Label>
                    <Textarea id="team-description" value={profile.description} />
                  </div>
                  <div>
                    <Label htmlFor="team-type">Team Type</Label>
                    <Input id="team-type" value={profile.type} />
                  </div>
                </CardContent>
              </Card>

              {/* Communication Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Communication</CardTitle>
                  <CardDescription>
                    Team communication preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="team-email">Team Email</Label>
                    <Input id="team-email" value={profile.contactInfo?.email || ''} />
                  </div>
                  <div>
                    <Label htmlFor="slack-channel">Slack Channel</Label>
                    <Input id="slack-channel" value={profile.contactInfo?.slackChannel || ''} />
                  </div>
                  <div>
                    <Label htmlFor="meeting-cadence">Meeting Cadence</Label>
                    <Input id="meeting-cadence" value={profile.communication?.meetingCadence || ''} />
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