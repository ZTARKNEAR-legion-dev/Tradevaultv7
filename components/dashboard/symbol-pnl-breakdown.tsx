'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/components/providers/data-provider'
import { calculateVolumeBySymbol, formatCurrency, formatPercent } from '@/lib/analytics'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function SymbolPnlBreakdown() {
  const { filteredTrades, isPro } = useData()
  const simple = !isPro

  const symbolData = useMemo(() => {
    const data = calculateVolumeBySymbol(filteredTrades)
    return data.map((s) => {
      const symbolTrades = filteredTrades.filter((t) => t.symbol === s.symbol)
      const wins = symbolTrades.filter((t) => t.pnl > 0).length
      return {
        symbol: s.symbol.replace('-PERP', ''),
        fullSymbol: s.symbol,
        pnl: s.pnl,
        volume: s.volume,
        trades: s.trades,
        winRate: s.trades > 0 ? (wins / s.trades) * 100 : 0,
        avgPnl: s.trades > 0 ? s.pnl / s.trades : 0,
      }
    }).sort((a, b) => b.pnl - a.pnl)
  }, [filteredTrades])

  if (symbolData.length === 0) {
    return (
      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">PnL by Symbol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Minus className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const bestSymbol = symbolData[0]
  const worstSymbol = symbolData[symbolData.length - 1]

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{simple ? 'Which Coins Made You Money?' : 'PnL by Symbol'}</CardTitle>
        <p className="text-xs text-muted-foreground">{simple ? 'See your profit or loss for each coin you traded' : 'Performance breakdown across all traded instruments'}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-profit/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-profit" />
              {simple ? 'Your Best Coin' : 'Best Performer'}
            </div>
            <p className="mt-1 font-mono text-sm font-bold text-profit">{bestSymbol.symbol}-PERP</p>
            <p className="font-mono text-xs text-profit">{formatCurrency(bestSymbol.pnl)} ({formatPercent(bestSymbol.winRate - 100 + 100).replace('+', '')}{' win rate'})</p>
          </div>
          <div className="rounded-lg bg-loss/5 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-loss" />
              {simple ? 'Your Worst Coin' : 'Worst Performer'}
            </div>
            <p className="mt-1 font-mono text-sm font-bold text-loss">{worstSymbol.symbol}-PERP</p>
            <p className="font-mono text-xs text-loss">{formatCurrency(worstSymbol.pnl)} ({worstSymbol.winRate.toFixed(1)}% win rate)</p>
          </div>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={symbolData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="symbol"
                tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.06 }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground))',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 2 }}
                formatter={(value: number) => [formatCurrency(value), 'PnL']}
                labelFormatter={(label) => `${label}-PERP`}
              />
              <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {symbolData.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mini table */}
        <div className="mt-3 space-y-1.5">
          {symbolData.map((s) => (
            <div key={s.fullSymbol} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-secondary/50">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{s.symbol}-PERP</span>
                <span className="text-muted-foreground">{s.trades} trades</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">{s.winRate.toFixed(0)}% WR</span>
                <span className="text-muted-foreground">{formatCurrency(s.volume, true)} vol</span>
                <span className={`font-mono font-semibold ${s.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {formatCurrency(s.pnl)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
