'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/components/providers/data-provider'
import { formatCurrency } from '@/lib/analytics'
import { Building2, TrendingUp, DollarSign } from 'lucide-react'
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

interface ExchangeStats {
  exchange: string
  volume: number
  fees: number
  trades: number
  pnl: number
}

const PROFIT_COLOR = 'hsl(160 84% 39%)'
const LOSS_COLOR = 'hsl(350 89% 60%)'
const PRIMARY_COLOR = 'hsl(var(--primary))'

export function ExchangeAnalysis() {
  const { filteredTrades, isPro } = useData()
  const simple = !isPro

  const exchangeStats = useMemo(() => {
    const stats = new Map<string, ExchangeStats>()
    
    filteredTrades.forEach(trade => {
      const exchange = trade.exchange || 'Unknown'
      const current = stats.get(exchange) || {
        exchange,
        volume: 0,
        fees: 0,
        trades: 0,
        pnl: 0,
      }
      
      current.volume += trade.notionalValue
      current.fees += trade.fees.total
      current.trades += 1
      current.pnl += trade.pnl
      
      stats.set(exchange, current)
    })
    
    return Array.from(stats.values()).sort((a, b) => b.volume - a.volume)
  }, [filteredTrades])

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
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <div>
            <CardTitle className="text-sm font-medium text-foreground">
              {simple ? 'Performance by Exchange' : 'Exchange Analysis'}
            </CardTitle>
            {simple && (
              <p className="mt-0.5 text-xs text-muted-foreground/70 italic">
                See which exchange you trade most on and pay the most fees
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {exchangeStats.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No exchange data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Volume by Exchange Chart */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Volume by Exchange</p>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exchangeStats} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="exchange"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      cursor={tooltipCursor}
                      contentStyle={tooltipStyle}
                      itemStyle={tooltipItemStyle}
                      labelStyle={tooltipLabelStyle}
                      formatter={(value: number) => [formatCurrency(value, true), 'Volume']}
                    />
                    <Bar dataKey="volume" radius={[3, 3, 0, 0]} fill={PRIMARY_COLOR} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fees by Exchange Chart */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Fees Paid by Exchange</p>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exchangeStats} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="exchange"
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
                      formatter={(value: number) => [formatCurrency(value), 'Fees']}
                    />
                    <Bar dataKey="fees" radius={[3, 3, 0, 0]} fill={LOSS_COLOR} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {exchangeStats.slice(0, 3).map((stat) => (
                <div key={stat.exchange} className="rounded-lg border border-border bg-secondary p-3">
                  <p className="text-xs font-medium text-muted-foreground">{stat.exchange}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="font-mono text-sm font-bold text-foreground">
                      {formatCurrency(stat.volume, true)}
                    </p>
                    <p className="text-xs text-muted-foreground">volume</p>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="font-mono text-xs font-semibold text-loss">
                      {formatCurrency(stat.fees)}
                    </p>
                    <p className="text-xs text-muted-foreground">fees</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.trades} trades</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
