'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/components/providers/data-provider'
import { calculateStreaks, formatCurrency } from '@/lib/analytics'
import { Flame, Snowflake } from 'lucide-react'

export function StreakTracker() {
  const { filteredTrades, isPro } = useData()
  const streaks = useMemo(() => calculateStreaks(filteredTrades), [filteredTrades])
  const simple = !isPro

  const longestWin = useMemo(
    () => streaks.filter((s) => s.type === 'win').sort((a, b) => b.count - a.count)[0],
    [streaks]
  )
  const longestLoss = useMemo(
    () => streaks.filter((s) => s.type === 'loss').sort((a, b) => b.count - a.count)[0],
    [streaks]
  )
  const currentStreak = streaks.length > 0 ? streaks[streaks.length - 1] : null

  const recentStreaks = streaks.slice(-12)

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-foreground">{simple ? 'Win & Loss Streaks' : 'Streak Analysis'}</CardTitle>
          {simple && <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic">{'A streak is when you win (or lose) multiple trades in a row. Green = winning, red = losing.'}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Current Streak */}
          {currentStreak && (
            <div
              className={`flex items-center gap-3 rounded-xl p-4 ${
                currentStreak.type === 'win' ? 'bg-profit/10 ring-1 ring-profit/10' : 'bg-loss/10 ring-1 ring-loss/10'
              }`}
            >
              {currentStreak.type === 'win' ? (
                <Flame className="h-5 w-5 text-profit" />
              ) : (
                <Snowflake className="h-5 w-5 text-loss" />
              )}
              <div>
                <p className="text-xs font-medium text-foreground">
                  Current: {currentStreak.count} {currentStreak.type === 'win' ? 'Win' : 'Loss'} Streak
                </p>
                <p className={`font-mono text-sm font-semibold ${currentStreak.type === 'win' ? 'text-profit' : 'text-loss'}`}>
                  {formatCurrency(currentStreak.pnl)}
                </p>
              </div>
            </div>
          )}

          {/* Records */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary/70 p-3.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Longest Win</p>
              <p className="font-mono text-2xl font-bold text-profit">{longestWin?.count || 0}</p>
              <p className="font-mono text-xs text-profit/70">
                {longestWin ? formatCurrency(longestWin.pnl) : '$0.00'}
              </p>
            </div>
            <div className="rounded-xl bg-secondary/70 p-3.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Longest Loss</p>
              <p className="font-mono text-2xl font-bold text-loss">{longestLoss?.count || 0}</p>
              <p className="font-mono text-xs text-loss/70">
                {longestLoss ? formatCurrency(longestLoss.pnl) : '$0.00'}
              </p>
            </div>
          </div>

          {/* Streak Timeline */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Recent Streaks</p>
            <div className="flex items-end gap-1">
              {recentStreaks.map((s, i) => {
                const maxCount = Math.max(...recentStreaks.map((r) => r.count), 1)
                const height = Math.max((s.count / maxCount) * 60, 12)
                return (
                  <div key={i} className="group relative flex flex-1 flex-col items-center">
                    <div
                      className={`w-full rounded-sm transition-all ${
                        s.type === 'win' ? 'bg-profit/70 hover:bg-profit' : 'bg-loss/70 hover:bg-loss'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                    <span className="mt-1 text-[8px] text-muted-foreground">{s.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
