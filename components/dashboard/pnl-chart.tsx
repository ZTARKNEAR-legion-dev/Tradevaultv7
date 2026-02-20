'use client'

import { useMemo, useState } from 'react'
import { useData } from '@/components/providers/data-provider'
import { calculateDailyPnl, calculateDrawdown, formatCurrency } from '@/lib/analytics'
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Bar,
  ComposedChart,
} from 'recharts'
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react'

export function PnlChart() {
  const { filteredTrades, isPro } = useData()
  const [showDrawdown, setShowDrawdown] = useState(false)
  const simple = !isPro
  const dailyPnl = useMemo(() => calculateDailyPnl(filteredTrades), [filteredTrades])
  const drawdown = useMemo(() => calculateDrawdown(filteredTrades), [filteredTrades])

  const chartData = useMemo(() => {
    return dailyPnl.map((d, i) => ({
      date: d.date.slice(5),
      pnl: d.pnl,
      cumulativePnl: d.cumulativePnl,
      drawdown: drawdown[i]?.drawdown || 0,
    }))
  }, [dailyPnl, drawdown])

  const finalPnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnl : 0
  const todayPnl = chartData.length > 0 ? chartData[chartData.length - 1].pnl : 0

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-14 text-center">
        <BarChart2 className="mb-2 h-6 w-6 text-muted-foreground/20" />
        <p className="text-xs font-medium text-foreground">No trade data</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Adjust filters to see PnL.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-baseline gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Cumulative PnL</p>
            <p className={`font-mono text-2xl font-extrabold tracking-tight ${finalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {formatCurrency(finalPnl)}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            todayPnl >= 0 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
          }`}>
            {todayPnl >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {formatCurrency(todayPnl)} today
          </span>
        </div>
        {isPro && (
          <button
            onClick={() => setShowDrawdown(!showDrawdown)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
              showDrawdown ? 'bg-loss/10 text-loss' : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Drawdown
          </button>
        )}
      </div>
      {simple && (
        <p className="px-4 pb-1 text-[10px] leading-snug text-muted-foreground/70 italic">
          {'This chart shows your total earnings over time. The line going up means you\'re making money. Green bars = daily profit, red bars = daily loss.'}
        </p>
      )}
      <div className="h-[230px] px-1 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="pnl"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0)}`}
            />
            {showDrawdown && (
              <YAxis yAxisId="dd" orientation="right" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} domain={['auto', 0]} />
            )}
            <Tooltip
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3', fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.04 }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '10px',
                fontSize: '11px',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
              formatter={(value: number, name: string) => {
                if (name === 'cumulativePnl') return [formatCurrency(value), 'Cumulative']
                if (name === 'pnl') return [formatCurrency(value), 'Daily']
                if (name === 'drawdown') return [`${value.toFixed(2)}%`, 'Drawdown']
                return [value, name]
              }}
            />
            <ReferenceLine yAxisId="pnl" y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.15} />
            <defs>
              <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area yAxisId="pnl" type="monotone" dataKey="cumulativePnl" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#pnlGrad)" />
            <Bar yAxisId="pnl" dataKey="pnl" fill="hsl(var(--profit))" opacity={0.2} radius={[2, 2, 0, 0]} />
            {showDrawdown && <Area yAxisId="dd" type="monotone" dataKey="drawdown" stroke="hsl(var(--loss))" strokeWidth={1} fill="hsl(var(--loss))" fillOpacity={0.04} strokeDasharray="4 2" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
