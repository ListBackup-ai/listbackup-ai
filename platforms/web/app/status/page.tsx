import { LandingLayout } from '@/components/landing/layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator, SystemStatus } from '@/components/ui/status-indicator'
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react'

const systemComponents = [
  {
    name: 'API Services',
    status: 'operational',
    uptime: '99.98%',
    responseTime: '145ms',
    description: 'Core API endpoints and authentication services'
  },
  {
    name: 'Backup Processing',
    status: 'operational', 
    uptime: '99.95%',
    responseTime: 'N/A',
    description: 'Data backup and synchronization processes'
  },
  {
    name: 'Dashboard & Web App',
    status: 'operational',
    uptime: '99.99%',
    responseTime: '89ms',
    description: 'User dashboard and web application interface'
  },
  {
    name: 'Integration Services',
    status: 'minor-issue',
    uptime: '99.87%',
    responseTime: '234ms',
    description: 'Third-party platform connections and data sync'
  },
  {
    name: 'Storage Systems',
    status: 'operational',
    uptime: '99.96%',
    responseTime: 'N/A',
    description: 'Data storage and retrieval infrastructure'
  },
  {
    name: 'Notification Services',
    status: 'operational',
    uptime: '99.92%',
    responseTime: '67ms',
    description: 'Email and webhook notification delivery'
  }
]

const recentIncidents = [
  {
    date: 'Dec 10, 2024',
    title: 'Intermittent delays in Stripe integration sync',
    status: 'resolved',
    duration: '1h 23m',
    description: 'Some users experienced delayed backup processing for Stripe data. Issue resolved by scaling integration workers.'
  },
  {
    date: 'Dec 8, 2024', 
    title: 'Scheduled maintenance - Database optimization',
    status: 'completed',
    duration: '2h 15m',
    description: 'Planned maintenance to optimize database performance. All services remained operational during maintenance window.'
  },
  {
    date: 'Dec 3, 2024',
    title: 'Brief API authentication delays',
    status: 'resolved',
    duration: '45m',
    description: 'Authentication requests experienced increased latency. Resolved by load balancer configuration update.'
  }
]

const maintenanceWindows = [
  {
    date: 'Dec 15, 2024',
    time: '2:00 AM - 4:00 AM PST',
    title: 'Infrastructure security updates',
    impact: 'No expected downtime',
    description: 'Applying security patches to underlying infrastructure. Services will remain operational.'
  },
  {
    date: 'Dec 22, 2024',
    time: '1:00 AM - 3:00 AM PST', 
    title: 'Database performance optimization',
    impact: 'Possible brief delays',
    description: 'Database optimization may cause temporary delays in backup processing during maintenance window.'
  }
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'operational':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'minor-issue':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    case 'major-outage':
      return <XCircle className="w-5 h-5 text-red-500" />
    default:
      return <CheckCircle className="w-5 h-5 text-green-500" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'operational':
      return 'bg-green-500'
    case 'minor-issue':
      return 'bg-yellow-500'
    case 'major-outage':
      return 'bg-red-500'
    default:
      return 'bg-green-500'
  }
}

function getIncidentColor(status: string) {
  switch (status) {
    case 'resolved':
      return 'bg-green-500/10 text-green-600 border-green-500/20'
    case 'investigating':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
    case 'identified':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    case 'monitoring':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }
}

export default function StatusPage() {
  const overallStatus = systemComponents.every(c => c.status === 'operational') ? 'operational' : 'degraded'

  return (
    <LandingLayout>
      <div className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-4">
                {overallStatus === 'operational' ? (
                  <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-yellow-500 mr-3" />
                )}
                <Badge className={
                  overallStatus === 'operational' 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20 text-lg px-6 py-2'
                    : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-lg px-6 py-2'
                }>
                  {overallStatus === 'operational' ? 'All Systems Operational' : 'Partial System Outage'}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">System Status</h1>
              <p className="text-lg text-muted-foreground">
                Real-time status and uptime information for ListBackup.ai services
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Last updated: {new Date().toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </p>
            </div>

            {/* Overall Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Overall Uptime', value: '99.95%', icon: TrendingUp },
                { label: 'Avg Response Time', value: '142ms', icon: Activity },
                { label: 'Active Incidents', value: '1', icon: AlertCircle },
                { label: 'Last Incident', value: '2 days ago', icon: Clock }
              ].map((metric, index) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <metric.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* System Components */}
            <Card className="mb-12">
              <CardHeader>
                <h2 className="text-2xl font-bold">System Components</h2>
                <p className="text-muted-foreground">Current status of all system components</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemComponents.map((component, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(component.status)}`} />
                        <div>
                          <h3 className="font-medium">{component.name}</h3>
                          <p className="text-sm text-muted-foreground">{component.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{component.uptime}</div>
                          <div className="text-muted-foreground">Uptime</div>
                        </div>
                        {component.responseTime !== 'N/A' && (
                          <div className="text-center">
                            <div className="font-medium">{component.responseTime}</div>
                            <div className="text-muted-foreground">Response</div>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(component.status)}
                          <span className="capitalize font-medium">
                            {component.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Incidents */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">Recent Incidents</h2>
                  <p className="text-muted-foreground">Past 30 days</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentIncidents.map((incident, index) => (
                      <div key={index} className="border-l-4 border-l-muted pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium">{incident.title}</h3>
                          <Badge className={getIncidentColor(incident.status)}>
                            {incident.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {incident.date} • Duration: {incident.duration}
                        </div>
                        <p className="text-sm">{incident.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Scheduled Maintenance */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">Scheduled Maintenance</h2>
                  <p className="text-muted-foreground">Upcoming maintenance windows</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {maintenanceWindows.map((maintenance, index) => (
                      <div key={index} className="border-l-4 border-l-blue-500 pl-4">
                        <h3 className="font-medium mb-2">{maintenance.title}</h3>
                        <div className="text-sm text-muted-foreground mb-2">
                          {maintenance.date} • {maintenance.time}
                        </div>
                        <div className="text-sm mb-2">
                          <span className="font-medium">Expected Impact:</span> {maintenance.impact}
                        </div>
                        <p className="text-sm">{maintenance.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status History Chart Placeholder */}
            <Card className="mt-8">
              <CardHeader>
                <h2 className="text-xl font-bold">90-Day Uptime History</h2>
                <p className="text-muted-foreground">Historical uptime performance</p>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Uptime chart would be displayed here</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>90 days ago</span>
                  <span>Overall uptime: 99.95%</span>
                  <span>Today</span>
                </div>
              </CardContent>
            </Card>

            {/* Subscribe to Updates */}
            <Card className="mt-8">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold mb-4">Stay Updated</h3>
                <p className="text-muted-foreground mb-6">
                  Subscribe to status updates and be notified of incidents and maintenance windows.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 border border-input rounded-md"
                  />
                  <button className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                    Subscribe
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LandingLayout>
  )
}