import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ViewAllModal } from '@/components/dashboard/ViewAllModal'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  Activity,
  Star,
  TrendingUp,
  AlertCircle,
  Bell,
  Settings,
  Eye
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { adminService } from '@/services/adminService'

export function DashboardPage() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'events' | 'organizers' | 'users'
    title: string
    description: string
    data: any[]
  }>({
    isOpen: false,
    type: 'events',
    title: '',
    description: '',
    data: []
  })
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminService.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: adminService.getRecentActivity,
    refetchInterval: 60000, // Refresh every minute
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: adminService.getAnalyticsOverview,
  })

  // Fetch full data for modals
  const { data: allEvents } = useQuery({
    queryKey: ['all-events'],
    queryFn: () => adminService.getEvents(100),
  })

  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => adminService.getUsers(100),
  })

  const handleViewAll = (type: 'events' | 'organizers' | 'users', title: string, description: string) => {
    let data: any[] = []
    
    switch (type) {
      case 'events':
        data = allEvents?.filter((event: any) => event.featured) || []
        break
      case 'organizers':
        data = stats?.topOrganizers || []
        break
      case 'users':
        data = allUsers || []
        break
    }
    
    setModalState({
      isOpen: true,
      type,
      title,
      description,
      data
    })
  }

  const handleCloseModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your app.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          icon={Users}
          description="+12% from last month"
          trend="up"
        />
        <StatsCard
          title="Active Events"
          value={stats?.activeEvents?.toLocaleString() || '0'}
          icon={Calendar}
          description="+8% from last month"
          trend="up"
        />
        <StatsCard
          title="Revenue"
          value={`₵${stats?.totalRevenue?.toLocaleString() || '0'}`}
          icon={DollarSign}
          description="+23% from last month"
          trend="up"
        />
        <StatsCard
          title="Pending Approvals"
          value={stats?.pendingApprovals || '0'}
          icon={Clock}
          description={stats?.pendingApprovals > 0 ? 'Requires attention' : 'All caught up!'}
          trend={stats?.pendingApprovals > 0 ? 'warning' : 'neutral'}
          badge={stats?.pendingApprovals > 0 ? stats.pendingApprovals : undefined}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Analytics Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics Overview
            </CardTitle>
            <CardDescription>
              User growth and event creation trends over the past 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
              </TabsList>
              <TabsContent value="users" className="mt-4">
                <AnalyticsChart 
                  data={analyticsData?.userGrowth || []}
                  type="users"
                  height={300}
                />
              </TabsContent>
              <TabsContent value="events" className="mt-4">
                <AnalyticsChart 
                  data={analyticsData?.eventCreation || []}
                  type="events"
                  height={300}
                />
              </TabsContent>
              <TabsContent value="revenue" className="mt-4">
                <AnalyticsChart 
                  data={analyticsData?.revenue || []}
                  type="revenue"
                  height={300}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest actions and updates
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewAll('users', 'All Recent Activity', 'Complete activity log')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RecentActivity 
              activities={recentActivity || []} 
              maxItems={4}
              showViewAll={true}
              onViewAll={() => handleViewAll('users', 'All Recent Activity', 'Complete activity log')}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Additional Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              App performance and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Status</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Response Time</span>
              <Badge variant="secondary">
                {stats?.apiResponseTime || '< 100ms'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Users (24h)</span>
              <Badge variant="secondary">
                {stats?.activeUsers24h?.toLocaleString() || '0'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Error Rate</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                0.01%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Events & Top Users */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Featured Events
                </CardTitle>
                <CardDescription>
                  Currently promoted events
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewAll('events', 'All Featured Events', 'Complete list of all featured events')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.featuredEvents?.slice(0, 3).map((event: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.name || event.title || 'Untitled Event'}</p>
                    <p className="text-sm text-muted-foreground truncate">{event.organizer || 'Unknown Organizer'}</p>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <Badge variant="secondary">
                      {event.ticketsSold || event.soldTickets || 0} sold
                    </Badge>
                  </div>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-8">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No featured events</p>
                </div>
              )}
              {stats?.featuredEvents && stats.featuredEvents.length > 3 && (
                <div className="text-center pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewAll('events', 'All Featured Events', 'Complete list of all featured events')}
                  >
                    +{stats.featuredEvents.length - 3} more events
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Organizers
                </CardTitle>
                <CardDescription>
                  Most active event creators
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewAll('organizers', 'All Top Organizers', 'Complete list of all event organizers')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topOrganizers?.slice(0, 3).map((organizer: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{organizer.name || organizer.email || 'Unknown Organizer'}</p>
                    <p className="text-sm text-muted-foreground">{organizer.eventsCount || 0} events</p>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <Badge variant="secondary">
                      ₵{organizer.revenue?.toLocaleString() || '0'}
                    </Badge>
                  </div>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No data available</p>
                </div>
              )}
              {stats?.topOrganizers && stats.topOrganizers.length > 3 && (
                <div className="text-center pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewAll('organizers', 'All Top Organizers', 'Complete list of all event organizers')}
                  >
                    +{stats.topOrganizers.length - 3} more organizers
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View All Modal */}
      <ViewAllModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title={modalState.title}
        description={modalState.description}
        type={modalState.type}
        data={modalState.data}
      />
    </div>
  )
}
