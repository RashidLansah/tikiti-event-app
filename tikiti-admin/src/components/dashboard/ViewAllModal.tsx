import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Star, Users, Calendar, MapPin, Eye } from 'lucide-react'

interface ViewAllModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  type: 'events' | 'organizers' | 'users'
  data: any[]
  onViewDetails?: (id: string) => void
}

export function ViewAllModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  type, 
  data,
  onViewDetails 
}: ViewAllModalProps) {
  
  const renderEventItem = (event: any, index: number) => (
    <Card key={index} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{event.name || event.title || 'Untitled Event'}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location || event.address || 'No location'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Date</p>
                <p>{event.date ? new Date(event.date).toLocaleDateString() : 'No date'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Price</p>
                <p className="font-semibold">{formatCurrency(event.price || 0)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Tickets Sold</p>
                <p>{event.soldTickets || event.ticketsSold || 0}/{event.totalTickets || 'Unlimited'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Status</p>
                <Badge variant={event.isActive ? "default" : "secondary"}>
                  {event.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            {event.featured && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewDetails(event.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderOrganizerItem = (organizer: any, index: number) => (
    <Card key={index} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">{organizer.name || organizer.email}</h3>
              <p className="text-sm text-gray-600">{organizer.email}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span>{organizer.eventsCount || 0} events</span>
                <span>•</span>
                <span className="font-medium">Revenue: {formatCurrency(organizer.revenue || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <Badge variant="secondary">
              {organizer.userType || 'organizer'}
            </Badge>
            {organizer.phone && (
              <p className="text-xs text-gray-500 mt-1">{organizer.phone}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderUserItem = (user: any, index: number) => (
    <Card key={index} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{user.name || user.email}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span>Joined: {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <Badge variant={user.userType === 'organiser' ? "default" : "secondary"}>
              {user.userType || 'attendee'}
            </Badge>
            {user.phone && (
              <p className="text-xs text-gray-500 mt-1">{user.phone}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderItem = (item: any, index: number) => {
    switch (type) {
      case 'events':
        return renderEventItem(item, index)
      case 'organizers':
        return renderOrganizerItem(item, index)
      case 'users':
        return renderUserItem(item, index)
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {data.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {type === 'events' && <Calendar className="h-8 w-8 text-gray-400" />}
                {type === 'organizers' && <Users className="h-8 w-8 text-gray-400" />}
                {type === 'users' && <Users className="h-8 w-8 text-gray-400" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No {type} found</h3>
              <p className="text-gray-500">
                {type === 'events' && 'No events have been created yet.'}
                {type === 'organizers' && 'No organizers have signed up yet.'}
                {type === 'users' && 'No users have registered yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing {data.length} {type}
                </p>
              </div>
              <div className="space-y-3">
                {data.map((item, index) => renderItem(item, index))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
