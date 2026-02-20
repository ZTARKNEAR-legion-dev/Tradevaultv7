'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/components/providers/data-provider'
import {
  calculateVolumeBySymbol,
  calculateFeeBreakdown,
  calculateCumulativeFees,
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
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts'

const COLORS = [
  'hsl(217 91% 60%)',
  'hsl(160 84% 39%)',
  'hsl(263 70% 58%)',
  'hsl(38 92% 50%)',
  'hsl(350 89% 60%)',
  'hsl(190 80% 50%)',
]

export function VolumeFeeChart() {
  const { filteredTrades, isPro } = useData()
  const simple = !isPro
  const volumeBySymbol = useMemo(() => calculateVolumeBySymbol(filteredTrades), [filteredTrades])
  const fees = useMemo(() => calculateFeeBreakdown(filteredTrades), [filteredTrades])
  const cumulativeFees = useMemo(() => calculateCumulativeFees(filteredTrades), [filteredTrades])

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-foreground">{simple ? 'Money Moved & Fees Paid' : 'Volume & Fees'}</CardTitle>
          {simple && <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic">{'Volume = total money you traded. Fees = what the exchange charged you.'}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Volume by Symbol */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Volume by Symbol</p>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeBySymbol} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="symbol"
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v.replace('-PERP', '')}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
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
                    formatter={(value: number) => [formatCurrency(value), 'Volume']}
                  />
                  <Bar dataKey="volume" radius={[3, 3, 0, 0]}>
                    {volumeBySymbol.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-[10px] text-muted-foreground">Trading Fees</p>
              <p className="font-mono text-sm font-semibold text-foreground">{formatCurrency(fees.trading)}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-[10px] text-muted-foreground">Funding Fees</p>
              <p className="font-mono text-sm font-semibold text-foreground">{formatCurrency(fees.funding)}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-[10px] text-muted-foreground">Total Fees</p>
              <p className="font-mono text-sm font-semibold text-loss">{formatCurrency(fees.total)}</p>
            </div>
          </div>

          {/* Cumulative Fees */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Cumulative Fees</p>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeFees} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip
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
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        tradingFee: 'Trading',
                        fundingFee: 'Funding',
                        cumulativeFee: 'Total',
                      }
                      return [formatCurrency(value), labels[name] || name]
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tradingFee"
                    stroke="hsl(217 91% 60%)"
                    fill="hsl(217 91% 60%)"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="fundingFee"
                    stroke="hsl(263 70% 58%)"
                    fill="hsl(263 70% 58%)"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
