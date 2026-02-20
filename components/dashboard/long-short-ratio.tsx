'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/components/providers/data-provider'
import { calculateMetrics, formatCurrency } from '@/lib/analytics'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const LONG_COLOR = 'hsl(217 91% 60%)'
const SHORT_COLOR = 'hsl(263 70% 58%)'

export function LongShortRatio() {
  const { filteredTrades, isPro } = useData()
  const metrics = useMemo(() => calculateMetrics(filteredTrades), [filteredTrades])
  const simple = !isPro

  const pieData = [
    { name: 'Long', value: metrics.longCount, color: LONG_COLOR },
    { name: 'Short', value: metrics.shortCount, color: SHORT_COLOR },
  ]

  const longWins = filteredTrades.filter((t) => t.side === 'long' && t.pnl > 0).length
  const shortWins = filteredTrades.filter((t) => t.side === 'short' && t.pnl > 0).length
  const longWinRate = metrics.longCount > 0 ? (longWins / metrics.longCount) * 100 : 0
  const shortWinRate = metrics.shortCount > 0 ? (shortWins / metrics.shortCount) * 100 : 0

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-foreground">{simple ? 'Buy vs Sell Bets' : 'Long / Short Analysis'}</CardTitle>
          {simple && <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic">{'Long = you bet the price goes UP. Short = you bet the price goes DOWN.'}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative h-[140px] w-[140px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={4}
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
              <span className="font-mono text-sm font-bold text-foreground">
                {metrics.longCount + metrics.shortCount > 0
                  ? `${((metrics.longCount / (metrics.longCount + metrics.shortCount)) * 100).toFixed(0)}%`
                  : '0%'}
              </span>
              <span className="text-[10px] text-muted-foreground">Long</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {/* Long Stats */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: LONG_COLOR }} />
                <span className="text-xs font-medium text-foreground">Long ({metrics.longCount})</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-xs">
                <div>
                  <p className="text-muted-foreground">PnL</p>
                  <p className={`font-mono font-semibold ${metrics.longPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(metrics.longPnl)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Win Rate</p>
                  <p className="font-mono font-semibold text-foreground">{longWinRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Short Stats */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SHORT_COLOR }} />
                <span className="text-xs font-medium text-foreground">Short ({metrics.shortCount})</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-xs">
                <div>
                  <p className="text-muted-foreground">PnL</p>
                  <p className={`font-mono font-semibold ${metrics.shortPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(metrics.shortPnl)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Win Rate</p>
                  <p className="font-mono font-semibold text-foreground">{shortWinRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
