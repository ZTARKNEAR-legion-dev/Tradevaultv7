'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/components/providers/data-provider'
import { calculateOrderTypePerformance, formatCurrency } from '@/lib/analytics'
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

const TYPE_COLORS: Record<string, string> = {
  Market: 'hsl(217 91% 60%)',
  Limit: 'hsl(160 84% 39%)',
  Stop: 'hsl(38 92% 50%)',
}

export function OrderTypeAnalysis() {
  const { filteredTrades, isPro } = useData()
  const orderData = useMemo(() => calculateOrderTypePerformance(filteredTrades), [filteredTrades])
  const simple = !isPro

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-foreground">{simple ? 'How You Place Trades' : 'Order Type Performance'}</CardTitle>
          {simple && <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic">{'Market = instant buy/sell, Limit = buy/sell at a set price, Stop = auto sell to limit losses.'}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {orderData.map((d) => (
              <div key={d.type} className="rounded-lg bg-secondary p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[d.type] || 'hsl(217 91% 60%)' }}
                  />
                  <span className="text-xs font-medium text-foreground">{d.type}</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{d.trades} trades</p>
                <p className={`font-mono text-sm font-semibold ${d.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {formatCurrency(d.pnl)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {d.winRate.toFixed(0)}% win | avg {formatCurrency(d.avgPnl)}
                </p>
              </div>
            ))}
          </div>

          {/* PnL Comparison Bar */}
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="type"
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
                  formatter={(value: number) => [formatCurrency(value), 'PnL']}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {orderData.map((d, i) => (
                    <Cell key={i} fill={TYPE_COLORS[d.type] || 'hsl(217 91% 60%)'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
