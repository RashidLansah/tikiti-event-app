import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AnalyticsChartProps {
  data: Array<{ date: string; [key: string]: any }>
  type: 'users' | 'events' | 'revenue'
  height?: number
}

export function AnalyticsChart({ data, type, height = 300 }: AnalyticsChartProps) {
  const getDataKey = () => {
    switch (type) {
      case 'users':
        return 'users'
      case 'events':
        return 'events'
      case 'revenue':
        return 'revenue'
      default:
        return 'value'
    }
  }

  const getColor = () => {
    switch (type) {
      case 'users':
        return '#3B82F6' // blue
      case 'events':
        return '#10B981' // green
      case 'revenue':
        return '#F59E0B' // amber
      default:
        return '#6B7280' // gray
    }
  }

  const formatValue = (value: number) => {
    if (type === 'revenue') {
      return `₵${value.toLocaleString()}`
    }
    return value.toLocaleString()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            📊
          </div>
          <p>No data available</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis 
          tickFormatter={formatValue}
          stroke="#6B7280"
          fontSize={12}
        />
        <Tooltip 
          labelFormatter={(label) => formatDate(label)}
          formatter={(value: number) => [formatValue(value), type.charAt(0).toUpperCase() + type.slice(1)]}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Line 
          type="monotone" 
          dataKey={getDataKey()} 
          stroke={getColor()} 
          strokeWidth={2}
          dot={{ fill: getColor(), strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: getColor(), strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
