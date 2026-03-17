'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PurposeData { label: string; count: number }

const CHART_COLORS = [
  'hsl(0, 0%, 13%)',
  'hsl(0, 0%, 25%)',
  'hsl(0, 0%, 35%)',
  'hsl(0, 0%, 45%)',
  'hsl(0, 0%, 55%)',
  'hsl(0, 0%, 65%)',
  'hsl(0, 0%, 75%)',
  'hsl(0, 0%, 83%)',
]

export function PurposeChart({ data }: { data: PurposeData[] }) {
  if (data.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="font-semibold text-foreground text-sm mb-4">Cases by Purpose</h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tick={{ fontSize: 11, fill: 'hsl(0, 0%, 45%)' }}
          />
          <Tooltip
            formatter={(value) => [value, 'Cases']}
            contentStyle={{
              border: '1px solid hsl(0, 0%, 91%)',
              borderRadius: '8px',
              fontSize: '12px',
              backgroundColor: 'hsl(0, 0%, 100%)',
              color: 'hsl(0, 0%, 9%)',
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
