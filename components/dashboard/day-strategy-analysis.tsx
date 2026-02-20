'use client'

import { useData } from '@/components/providers/data-provider'
import { calculateDayWinRate, calculateStrategyPerformance, formatCurrency } from '@/lib/analytics'
import { Trophy, TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react'

const STRATEGY_COLORS: Record<string, string> = {
  'Breakout': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  'Breakdown': 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20',
  'Reversal': 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
  'Scalp': 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/20',
  'Trend Following': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  'Momentum': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
  'Unknown': 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
}

function getStratColor(strat: string) {
  return STRATEGY_COLORS[strat] || STRATEGY_COLORS['Unknown']
}

function WinRateRing({ rate, size = 48 }: { rate: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (rate / 100) * circ
  const color = rate >= 70 ? 'text-profit' : rate >= 50 ? 'text-primary' : 'text-loss'

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-border" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className={`stroke-current ${color}`} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" className={`fill-current text-[10px] font-bold ${color} rotate-90`} style={{ transformOrigin: 'center' }}>
        {Math.round(rate)}%
      </text>
    </svg>
  )
}

export function DayStrategyAnalysis() {
  const { filteredTrades, isPro } = useData()
  const simple = !isPro
  const dayWinRates = calculateDayWinRate(filteredTrades)
  const stratPerf = calculateStrategyPerformance(filteredTrades)

  // Only show days that have trades
  const activeDays = dayWinRates.filter((d) => d.totalTrades > 0)
  const bestDay = activeDays.length > 0 ? activeDays.reduce((a, b) => a.winRate > b.winRate ? a : b) : null
  const worstDay = activeDays.length > 0 ? activeDays.reduce((a, b) => a.winRate < b.winRate ? a : b) : null

  if (filteredTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
        <Calendar className="mb-2 h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">No trade data available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Day-wise Win Rate Cards */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Calendar className="h-3 w-3 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">{simple ? 'Which Days Work Best?' : 'Day-wise Win Rate'}</h3>
              <p className="text-[9px] text-muted-foreground">{simple ? 'See which days you win most so you can trade smarter' : 'Your win probability for each day of the week'}</p>
            </div>
          </div>
          {bestDay && (
            <div className="hidden items-center gap-1 rounded-lg border border-profit/20 bg-profit/[0.06] px-2 py-1 sm:flex">
              <Trophy className="h-3 w-3 text-profit" />
              <span className="text-[10px] font-semibold text-profit">Best: {bestDay.day}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1.5 px-3 pb-3">
          {dayWinRates.map((day) => {
            const isBest = bestDay?.dayIndex === day.dayIndex
            const isWorst = worstDay?.dayIndex === day.dayIndex && activeDays.length > 1
            const hasData = day.totalTrades > 0

            return (
              <div
                key={day.day}
                className={`relative flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2.5 transition-colors ${
                  isBest
                    ? 'border-profit/25 bg-profit/[0.04]'
                    : isWorst
                    ? 'border-loss/25 bg-loss/[0.04]'
                    : 'border-border bg-background/50'
                }`}
              >
                <span className="text-[9px] font-semibold text-muted-foreground">{day.day.slice(0, 3)}</span>
                {hasData ? (
                  <>
                    <WinRateRing rate={day.winRate} size={40} />
                    <span className="text-[9px] text-muted-foreground">{day.wins}W / {day.totalTrades - day.wins}L</span>
                    {day.bestStrategy && (
                      <span className={`mt-0.5 rounded border px-1 py-0.5 text-[8px] font-medium ${getStratColor(day.bestStrategy)}`}>
                        {day.bestStrategy}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex h-[40px] w-[40px] items-center justify-center">
                    <span className="text-[9px] text-muted-foreground/40">--</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Strategy Performance Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Target className="h-3 w-3 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">{simple ? 'Your Trading Methods' : 'Strategy Performance'}</h3>
            <p className="text-[9px] text-muted-foreground">{simple ? 'See which approaches make you the most money' : 'Which strategy works best on which day'}</p>
          </div>
        </div>

        <div className="px-3 pb-3">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-2.5 py-2 text-left font-semibold text-muted-foreground">Strategy</th>
                  <th className="px-2.5 py-2 text-center font-semibold text-muted-foreground">Trades</th>
                  <th className="px-2.5 py-2 text-center font-semibold text-muted-foreground">Win Rate</th>
                  <th className="px-2.5 py-2 text-right font-semibold text-muted-foreground">PnL</th>
                  <th className="hidden px-2.5 py-2 text-center font-semibold text-muted-foreground sm:table-cell">Best Day</th>
                  <th className="hidden px-2.5 py-2 text-center font-semibold text-muted-foreground sm:table-cell">Worst Day</th>
                </tr>
              </thead>
              <tbody>
                {stratPerf.map((s, i) => (
                  <tr key={s.strategy} className={i < stratPerf.length - 1 ? 'border-b border-border/50' : ''}>
                    <td className="px-2.5 py-2">
                      <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold ${getStratColor(s.strategy)}`}>
                        {s.strategy}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-center font-mono text-foreground">{s.trades}</td>
                    <td className="px-2.5 py-2 text-center">
                      <span className={`font-mono font-bold ${s.winRate >= 60 ? 'text-profit' : s.winRate >= 45 ? 'text-foreground' : 'text-loss'}`}>
                        {s.winRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className={`px-2.5 py-2 text-right font-mono font-semibold ${s.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatCurrency(s.pnl)}
                    </td>
                    <td className="hidden px-2.5 py-2 text-center sm:table-cell">
                      {s.bestDay ? (
                        <span className="inline-flex items-center gap-0.5 text-profit">
                          <TrendingUp className="h-2.5 w-2.5" />
                          {s.bestDay}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">--</span>
                      )}
                    </td>
                    <td className="hidden px-2.5 py-2 text-center sm:table-cell">
                      {s.worstDay ? (
                        <span className="inline-flex items-center gap-0.5 text-loss">
                          <TrendingDown className="h-2.5 w-2.5" />
                          {s.worstDay}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
