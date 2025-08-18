import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EventDetailModal } from '@/components/events/EventDetailModal'
import { adminService } from '@/services/adminService'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { Calendar, Users, MapPin, Clock, Star, Check, X, Eye, Search, Filter } from 'lucide-react'

export function EventsPage() {
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ['events', selectedOrganizer],
    queryFn: () => adminService.getEvents(100, selectedOrganizer || undefined),
  })

  const { data: organizers } = useQuery({
    queryKey: ['organizers'],
    queryFn: () => adminService.getOrganizers(),
  })

  const handleApproveEvent = async (eventId: string) => {
    try {
      await adminService.approveEvent(eventId)
      refetch() // Refresh the data
    } catch (error) {
      console.error('Error approving event:', error)
    }
  }

  const handleRejectEvent = async (eventId: string) => {
    try {
      await adminService.rejectEvent(eventId, 'Does not meet guidelines')
      refetch() // Refresh the data
    } catch (error) {
      console.error('Error rejecting event:', error)
    }
  }

  const handleFeatureEvent = async (eventId: string, featured: boolean) => {
    try {
      await adminService.featureEvent(eventId, featured)
      refetch() // Refresh the data
    } catch (error) {
      console.error('Error featuring event:', error)
    }
  }

  const handleViewEvent = (eventId: string) => {
    setSelectedEventId(eventId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEventId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading events: {(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const realEvents = events || []
  
  // Filter events by search term
  const filteredEvents = realEvents.filter((event: any) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      (event.name || event.title || '').toLowerCase().includes(searchLower) ||
      (event.location || event.address || '').toLowerCase().includes(searchLower) ||
      (event.description || '').toLowerCase().includes(searchLower)
    )
  })
  
  const activeEvents = filteredEvents.filter((event: any) => event.isActive === true)
  const pendingEvents = filteredEvents.filter((event: any) => !event.status || event.status === 'pending')
  const featuredEvents = filteredEvents.filter((event: any) => event.featured === true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground">
            Moderate and manage events from your mobile app
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Organizer Filter */}
          <div className="relative">
            <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedOrganizer}
              onChange={(e) => setSelectedOrganizer(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Organizers</option>
              {(organizers || []).map((organizer: any) => (
                <option key={organizer.id} value={organizer.id}>
                  {organizer.name || organizer.email}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{filteredEvents.length}</p>
                <p className="text-sm text-gray-600">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{activeEvents.length}</p>
                <p className="text-sm text-gray-600">Active Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{pendingEvents.length}</p>
                <p className="text-sm text-gray-600">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{featuredEvents.length}</p>
                <p className="text-sm text-gray-600">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>
            Events created by organizers in your mobile app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Events Found</h3>
              <p className="text-gray-500">
                Events will appear here when organizers create them in your mobile app.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event: any) => (
                <div key={event.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{event.name || event.title || 'Untitled Event'}</h3>
                        <div className="flex gap-2">
                          <Badge variant={event.isActive ? "default" : "secondary"}>
                            {event.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {event.featured && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {(!event.status || event.status === 'pending') && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location || event.address || 'No location'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {event.date ? new Date(event.date).toLocaleDateString() : 'No date'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{event.soldTickets || 0}/{event.totalTickets || 0} tickets</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatCurrency(event.price || 0)}
                          </span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="text-xs text-gray-500">
                        Created: {event.createdAt ? formatDateTime(
                          event.createdAt?.toDate ? event.createdAt.toDate() : new Date(event.createdAt)
                        ) : 'Unknown'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewEvent(event.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      
                      {(!event.status || event.status === 'pending') && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleApproveEvent(event.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRejectEvent(event.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        variant={event.featured ? "secondary" : "outline"} 
                        size="sm"
                        onClick={() => handleFeatureEvent(event.id, !event.featured)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {event.featured ? 'Unfeature' : 'Feature'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      <EventDetailModal
        eventId={selectedEventId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
