'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useData } from '@/components/providers/data-provider'
import {
  calculateSessionPerformance,
  calculateHourlyPerformance,
  calculateDayOfWeekPerformance,
  formatCurrency,
} from '@/lib/analytics'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts'

const PROFIT_COLOR = 'hsl(160 84% 39%)'
const LOSS_COLOR = 'hsl(350 89% 60%)'

export function TimeAnalysis() {
  const { filteredTrades, isPro } = useData()
  const simple = !isPro
  const sessions = useMemo(() => calculateSessionPerformance(filteredTrades), [filteredTrades])
  const hourly = useMemo(() => calculateHourlyPerformance(filteredTrades), [filteredTrades])
  const dayOfWeek = useMemo(() => calculateDayOfWeekPerformance(filteredTrades), [filteredTrades])

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    fontSize: '11px',
    color: 'hsl(var(--foreground))',
  }
  const tooltipItemStyle = { color: 'hsl(var(--foreground))' }
  const tooltipLabelStyle = { color: 'hsl(var(--foreground))', fontWeight: 600 }
  const tooltipCursor = { fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.06 }

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-foreground">{simple ? 'Best Times to Trade' : 'Time-Based Analysis'}</CardTitle>
          {simple && <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic">{'Find out which time of day and which session works best for you.'}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="mb-3 grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="sessions" className="text-xs">{simple ? 'Markets' : 'Sessions'}</TabsTrigger>
            <TabsTrigger value="hourly" className="text-xs">{simple ? 'By Hour' : 'Hourly'}</TabsTrigger>
            <TabsTrigger value="daily" className="text-xs">{simple ? 'By Day' : 'Day of Week'}</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.session} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">{s.session}</p>
                    <p className="text-[10px] text-muted-foreground">{s.trades} trades | {s.winRate.toFixed(0)}% win rate</p>
                  </div>
                  <p className={`font-mono text-sm font-semibold ${s.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(s.pnl)}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hourly">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v} UTC`}
                    label={{ value: 'Time (UTC)', position: 'insideBottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    cursor={tooltipCursor}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                    formatter={(value: number, name: string) => {
                      if (name === 'pnl') return [formatCurrency(value), 'PnL']
                      return [value, name]
                    }}
                    labelFormatter={(v) => `${v}:00 - ${v}:59 UTC`}
                  />
                  <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                    {hourly.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="daily">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeek} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    cursor={tooltipCursor}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                    formatter={(value: number, name: string) => {
                      if (name === 'pnl') return [formatCurrency(value), 'PnL']
                      return [value, name]
                    }}
                  />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {dayOfWeek.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? PROFIT_COLOR : LOSS_COLOR} opacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
