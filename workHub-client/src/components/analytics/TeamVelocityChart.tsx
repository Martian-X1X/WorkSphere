import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from 'recharts'
import type { TeamVelocityMember } from '@/types/analytics'

interface TeamVelocityChartProps {
  data: TeamVelocityMember[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: Partial<TooltipContentProps>) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-800 border border-surface-700/60 rounded-xl px-3 py-2.5 shadow-xl text-xs space-y-1">
      <p className="text-surface-100 font-semibold mb-1">{String(label ?? '')}</p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-surface-400">{p.name}:</span>
          <span className="text-surface-100 font-medium">{String(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  )
}

export function TeamVelocityChart({ data, loading }: TeamVelocityChartProps) {
  const chartData = data.map((m) => ({
    ...m,
    name: m.fullName.split(' ')[0],
  }))

  if (loading) {
    return (
      <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5 animate-pulse h-72" />
    )
  }

  return (
    <div className="bg-surface-800/60 border border-surface-700/40 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-surface-100">Team Velocity</h3>
          <p className="text-xs text-surface-500 mt-0.5">Tasks completed this week</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-surface-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-primary-500 inline-block" />
            Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" />
            In Progress
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-surface-500 text-center py-12">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis
              dataKey="name"
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff06' }} />
            <Bar
              dataKey="completed"
              name="Completed"
              fill="#38bdf8"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="inProgress"
              name="In Progress"
              fill="#60a5fa"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
