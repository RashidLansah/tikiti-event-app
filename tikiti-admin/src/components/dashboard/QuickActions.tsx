import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  UserCheck, 
  Eye, 
  Bell, 
  Settings,
  BarChart3,
  Plus
} from 'lucide-react'

export function QuickActions() {
  const navigate = useNavigate()

  const actions = [
    {
      title: 'Manage Users',
      description: 'View and moderate user accounts',
      icon: UserCheck,
      onClick: () => navigate('/users'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Review Events',
      description: 'Approve pending event submissions',
      icon: Eye,
      onClick: () => navigate('/events'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Send Notification',
      description: 'Push message to mobile users',
      icon: Bell,
      onClick: () => navigate('/notifications'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'View Analytics',
      description: 'Check app performance metrics',
      icon: BarChart3,
      onClick: () => navigate('/analytics'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'App Settings',
      description: 'Configure app features',
      icon: Settings,
      onClick: () => navigate('/settings'),
      color: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      title: 'Create Admin',
      description: 'Add new admin user',
      icon: Plus,
      onClick: () => alert('Create admin functionality - coming soon!'),
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          className="h-auto p-4 justify-start text-left hover:shadow-md transition-shadow"
          onClick={action.onClick}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg text-white ${action.color}`}>
              <action.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-sm">{action.title}</div>
              <div className="text-xs text-gray-500">{action.description}</div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  )
}
