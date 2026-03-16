'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PurposeData { label: string; count: number }

const CHART_COLORS = ['#4F46E5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f0f4ff', '#f8fafc']

export function PurposeChart({ data }: { data: PurposeData[] }) {
  if (data.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Cases by Purpose</h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tick={{ fontSize: 12, fill: '#64748B' }}
          />
          <Tooltip
            formatter={(value) => [value, 'Cases']}
            contentStyle={{ border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px' }}
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
