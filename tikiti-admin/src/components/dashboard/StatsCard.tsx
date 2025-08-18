import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  description: string
  trend?: 'up' | 'down' | 'neutral' | 'warning'
  badge?: number
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend = 'neutral',
  badge 
}: StatsCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600', 
    neutral: 'text-gray-600',
    warning: 'text-orange-600'
  }

  const iconBgColors = {
    up: 'bg-green-100',
    down: 'bg-red-100',
    neutral: 'bg-blue-100', 
    warning: 'bg-orange-100'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={cn('p-2 rounded-lg', iconBgColors[trend])}>
              <Icon className={cn('h-6 w-6', trendColors[trend])} />
            </div>
            {badge && (
              <div className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {badge}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className={cn('text-sm mt-1', trendColors[trend])}>
            {description}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
