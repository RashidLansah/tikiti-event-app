import { formatDateTime } from '@/lib/utils'
import { RecentActivity as ActivityType } from '@/services/adminService'
import { 
  UserPlus, 
  Calendar, 
  Ticket, 
  CheckCircle,
  Clock
} from 'lucide-react'

interface RecentActivityProps {
  activities: ActivityType[]
  maxItems?: number
  showViewAll?: boolean
  onViewAll?: () => void
}

export function RecentActivity({ activities, maxItems = 5, showViewAll = false, onViewAll }: RecentActivityProps) {
  const getActivityIcon = (type: ActivityType['type']) => {
    switch (type) {
      case 'user_registered':
        return UserPlus
      case 'event_created':
        return Calendar
      case 'ticket_purchased':
        return Ticket
      case 'event_approved':
        return CheckCircle
      default:
        return Clock
    }
  }

  const getActivityColor = (type: ActivityType['type']) => {
    switch (type) {
      case 'user_registered':
        return 'text-blue-600 bg-blue-100'
      case 'event_created':
        return 'text-green-600 bg-green-100'
      case 'ticket_purchased':
        return 'text-purple-600 bg-purple-100'
      case 'event_approved':
        return 'text-emerald-600 bg-emerald-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
      </div>
    )
  }

  const displayedActivities = activities.slice(0, maxItems)
  const hasMore = activities.length > maxItems

  return (
    <div className="space-y-4">
      {displayedActivities.map((activity) => {
        const Icon = getActivityIcon(activity.type)
        const colorClass = getActivityColor(activity.type)
        
        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(activity.timestamp)}
              </p>
            </div>
          </div>
        )
      })}
      
      {hasMore && showViewAll && onViewAll && (
        <div className="text-center pt-2">
          <button 
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            +{activities.length - maxItems} more activities
          </button>
        </div>
      )}
    </div>
  )
}
