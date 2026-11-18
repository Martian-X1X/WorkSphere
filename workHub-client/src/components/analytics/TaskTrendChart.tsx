import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { TaskTrendPoint } from '@/types/analytics'

interface TaskTrendChartProps {
  data: TaskTrendPoint[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: Partial<TooltipContentProps>) {
  if (!active || !payload?.length) return null
  const date = typeof label === 'string' ? parseISO(label) : null

  return (
    <div className="bg-surface-800 border border-surface-700/60 rounded-xl px-3 py-2.5 shadow-xl text-xs space-y-1">
      <p className="text-surface-400 font-medium mb-1.5">
        {date && !Number.isNaN(date.getTime())
          ? format(date, 'MMM d, yyyy')
          : String(label ?? '')}
      </p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-surface-300">{p.name}:</span>
          <span className="text-surface-100 font-semibold">{String(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  )
}

export function TaskTrendChart({ data, loading }: TaskTrendChartProps) {
  const tickFormatter = (value: string, index: number) =>
    index % 5 === 0 ? format(parseISO(value), 'MMM d') : ''

  if (loading) {
    return (
      <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5 animate-pulse h-72" />
    )
  }

  return (
    <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-surface-100">Task Trend</h3>
          <p className="text-xs text-surface-500 mt-0.5">Last 30 days</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-surface-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-primary-500 rounded inline-block" />
            Created
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-green-400 rounded inline-block" />
            Completed
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={tickFormatter}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="created"
            name="Created"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#38bdf8' }}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#4ade80"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#4ade80' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
