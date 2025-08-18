import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { adminService } from '@/services/adminService'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Star, 
  DollarSign, 
  Ticket, 
  User,
  Mail,
  CreditCard,
  Download,
  X
} from 'lucide-react'

interface EventDetailModalProps {
  eventId: string | null
  isOpen: boolean
  onClose: () => void
}

export function EventDetailModal({ eventId, isOpen, onClose }: EventDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'attendees' | 'stats'>('details')

  const { data: eventDetails, isLoading, error } = useQuery({
    queryKey: ['eventDetails', eventId],
    queryFn: () => eventId ? adminService.getEventDetails(eventId) : null,
    enabled: !!eventId && isOpen,
  })

  if (!isOpen || !eventId) return null

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !eventDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="text-center text-red-600 p-6">
            <p>Error loading event details: {(error as Error)?.message || 'Unknown error'}</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const { attendees, bookingStats, organizer } = eventDetails

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {eventDetails.name || eventDetails.title || 'Untitled Event'}
              </DialogTitle>
              <DialogDescription className="text-lg mt-2">
                Event Management Dashboard
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={eventDetails.isActive ? "default" : "secondary"}>
                {eventDetails.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {eventDetails.featured && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {eventDetails.autoApproved && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Auto-Approved
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Event Details
          </button>
          <button
            onClick={() => setActiveTab('attendees')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'attendees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Attendees ({attendees.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Event Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">Date</p>
                      <p>{eventDetails.date ? new Date(eventDetails.date).toLocaleDateString() : 'No date set'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Time</p>
                      <p>{eventDetails.time || 'No time set'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Location</p>
                      <p>{eventDetails.location || eventDetails.address || 'No location'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Category</p>
                      <p>{eventDetails.category || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Price</p>
                      <p className="font-semibold">{formatCurrency(eventDetails.price || 0)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Total Tickets</p>
                      <p>{eventDetails.totalTickets || 'Unlimited'}</p>
                    </div>
                  </div>
                  
                  {eventDetails.description && (
                    <div>
                      <p className="font-medium text-gray-600 mb-2">Description</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {eventDetails.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Organizer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {organizer ? (
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-600">Name</p>
                        <p>{organizer.name || organizer.email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Email</p>
                        <p>{organizer.email}</p>
                      </div>
                      {organizer.phone && (
                        <div>
                          <p className="font-medium text-gray-600">Phone</p>
                          <p>{organizer.phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-600">Joined</p>
                        <p>{organizer.createdAt ? formatDateTime(
                          organizer.createdAt?.toDate ? organizer.createdAt.toDate() : new Date(organizer.createdAt)
                        ) : 'Unknown'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Organizer information not available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Event Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Event Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Created</p>
                    <p>{eventDetails.createdAt ? formatDateTime(
                      eventDetails.createdAt?.toDate ? eventDetails.createdAt.toDate() : new Date(eventDetails.createdAt)
                    ) : 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Status</p>
                    <p className="capitalize">{eventDetails.status || 'pending'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Event ID</p>
                    <p className="font-mono text-xs">{eventDetails.id}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Organizer ID</p>
                    <p className="font-mono text-xs">{eventDetails.organizerId || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'attendees' && (
          <div className="space-y-4">
            {attendees.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Attendees Yet</h3>
                  <p className="text-gray-500">
                    Attendees will appear here when they purchase tickets or RSVP for this event.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Attendees ({attendees.length} bookings, {bookingStats.attendeeCount} tickets)
                  </h3>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export List
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {attendees.map((attendee) => (
                    <Card key={attendee.bookingId}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                attendee.source === 'web' ? 'bg-green-100' : 'bg-blue-100'
                              }`}>
                                <User className={`h-4 w-4 ${
                                  attendee.source === 'web' ? 'text-green-600' : 'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{attendee.userName}</p>
                                  {attendee.source === 'web' && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                      Web
                                    </Badge>
                                  )}
                                  {attendee.registrationType === 'rsvp' && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                      RSVP
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {attendee.userEmail}
                                </p>
                                {attendee.phoneNumber && (
                                  <p className="text-sm text-gray-600">
                                    📱 {attendee.phoneNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-gray-600">Tickets</p>
                                <p>{attendee.ticketQuantity}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-600">Total Paid</p>
                                <p className="font-semibold">{formatCurrency(attendee.totalAmount)}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-600">Booking Date</p>
                                <p>{attendee.bookingDate ? formatDateTime(
                                  attendee.bookingDate?.toDate ? attendee.bookingDate.toDate() : new Date(attendee.bookingDate)
                                ) : 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-600">Status</p>
                                <Badge variant={attendee.status === 'confirmed' ? 'default' : 'secondary'}>
                                  {attendee.status}
                                </Badge>
                              </div>
                              {attendee.gender && (
                                <div>
                                  <p className="font-medium text-gray-600">Gender</p>
                                  <p>{attendee.gender}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right text-xs text-gray-500">
                            <p>Booking ID: {attendee.bookingId.slice(-8)}</p>
                            <p className="flex items-center gap-1 mt-1">
                              <CreditCard className="h-3 w-3" />
                              {attendee.paymentMethod}
                            </p>
                            <p className="mt-1">
                              Source: {attendee.source || 'mobile'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Ticket className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold">{bookingStats.totalBookings}</p>
                      <p className="text-sm text-gray-600">Total Bookings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold">{bookingStats.attendeeCount}</p>
                      <p className="text-sm text-gray-600">Total Attendees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold">{formatCurrency(bookingStats.totalRevenue)}</p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-500" />
                    <div className="ml-3">
                      <p className="text-2xl font-bold">
                        {eventDetails.totalTickets ? 
                          Math.round((bookingStats.attendeeCount / eventDetails.totalTickets) * 100) : 0}%
                      </p>
                      <p className="text-sm text-gray-600">Tickets Sold</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Breakdown */}
            {bookingStats.totalRevenue > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Gross Revenue</span>
                      <span className="font-semibold">{formatCurrency(bookingStats.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average per Ticket</span>
                      <span>{formatCurrency(bookingStats.attendeeCount > 0 ? bookingStats.totalRevenue / bookingStats.attendeeCount : 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average per Booking</span>
                      <span>{formatCurrency(bookingStats.totalBookings > 0 ? bookingStats.totalRevenue / bookingStats.totalBookings : 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
