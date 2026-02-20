'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/components/providers/data-provider'
import { calculateMetrics, formatCurrency } from '@/lib/analytics'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const PROFIT_COLOR = 'hsl(160 84% 39%)'
const LOSS_COLOR = 'hsl(350 89% 60%)'

export function WinLossAnalysis() {
  const { filteredTrades, isPro } = useData()
  const metrics = useMemo(() => calculateMetrics(filteredTrades), [filteredTrades])
  const simple = !isPro

  const pieData = [
    { name: 'Wins', value: metrics.winningTrades, color: PROFIT_COLOR },
    { name: 'Losses', value: metrics.losingTrades, color: LOSS_COLOR },
  ]

  const distributionData = useMemo(() => {
    const ranges = [
      { label: '< -$200', min: -Infinity, max: -200 },
      { label: '-$200 to -$50', min: -200, max: -50 },
      { label: '-$50 to $0', min: -50, max: 0 },
      { label: '$0 to $50', min: 0, max: 50 },
      { label: '$50 to $200', min: 50, max: 200 },
      { label: '> $200', min: 200, max: Infinity },
    ]
    return ranges.map((r) => ({
      range: r.label,
      count: filteredTrades.filter((t) => t.pnl > r.min && t.pnl <= r.max).length,
      isProfit: r.min >= 0,
    }))
  }, [filteredTrades])

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-foreground">{simple ? 'Wins vs Losses' : 'Win/Loss Analysis'}</CardTitle>
          {simple && <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic">{'See how many trades you won and lost, and how much each was worth.'}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Win Rate Donut */}
          <div className="flex items-center gap-6">
            <div className="relative h-[120px] w-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-lg font-bold text-foreground">{metrics.winRate.toFixed(0)}%</span>
                <span className="text-[10px] text-muted-foreground">Win Rate</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <p className="text-muted-foreground">Avg Win</p>
                <p className="font-mono font-semibold text-profit">{formatCurrency(metrics.averageWin)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Loss</p>
                <p className="font-mono font-semibold text-loss">{formatCurrency(metrics.averageLoss)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Best Trade</p>
                <p className="font-mono font-semibold text-profit">{formatCurrency(metrics.largestWin)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Worst Trade</p>
                <p className="font-mono font-semibold text-loss">{formatCurrency(metrics.largestLoss)}</p>
              </div>
            </div>
          </div>

          {/* PnL Distribution */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">PnL Distribution</p>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.06 }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      fontSize: '11px',
                      color: 'hsl(var(--foreground))',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {distributionData.map((entry, i) => (
                      <Cell key={i} fill={entry.isProfit ? PROFIT_COLOR : LOSS_COLOR} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
