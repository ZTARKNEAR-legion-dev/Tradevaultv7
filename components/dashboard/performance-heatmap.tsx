'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/components/providers/data-provider'
import { calculateCalendarData, formatCurrency } from '@/lib/analytics'
import { format, parseISO, getDay, startOfWeek, eachWeekOfInterval, subDays } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function getPnlColor(pnl: number, maxAbsPnl: number): string {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  if (pnl === 0) return isDark ? 'hsl(225 18% 11%)' : 'hsl(220 14% 92%)'
  const intensity = Math.min(Math.abs(pnl) / (maxAbsPnl || 1), 1)
  if (pnl > 0) {
    return isDark
      ? `hsl(160 84% ${39 - intensity * 15}% / ${0.3 + intensity * 0.7})`
      : `hsl(160 84% ${45 - intensity * 10}% / ${0.25 + intensity * 0.65})`
  }
  return isDark
    ? `hsl(350 89% ${60 - intensity * 15}% / ${0.3 + intensity * 0.7})`
    : `hsl(350 89% ${55 - intensity * 10}% / ${0.25 + intensity * 0.65})`
}

export function PerformanceHeatmap() {
  const { filteredTrades, isPro } = useData()
  const simple = !isPro
  const calendarData = useMemo(() => calculateCalendarData(filteredTrades), [filteredTrades])

  const dataMap = useMemo(() => {
    const map = new Map<string, { pnl: number; trades: number }>()
    for (const d of calendarData) {
      map.set(d.date, { pnl: d.pnl, trades: d.trades })
    }
    return map
  }, [calendarData])

  const maxAbsPnl = useMemo(
    () => Math.max(...calendarData.map((d) => Math.abs(d.pnl)), 1),
    [calendarData]
  )

  const weeks = useMemo(() => {
    const now = new Date()
    const start = subDays(now, 90)
    return eachWeekOfInterval({ start, end: now }, { weekStartsOn: 0 })
  }, [])

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

  return (
    <Card className="rounded-xl border-border bg-card ring-2 ring-primary/20 shadow-lg shadow-primary/10">
      <CardHeader className="pb-2 bg-primary/5 rounded-t-xl">
        <div>
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {simple ? 'Your Trading Calendar' : 'Performance Heatmap'}
          </CardTitle>
          {simple && <p className="mt-0.5 text-xs text-muted-foreground/70 italic">{'Each box is one day. Green = profit, red = loss. Darker color = bigger profit/loss.'}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={0}>
          <div className="flex gap-1.5">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2">
              {dayLabels.map((label, i) => (
                <div key={i} className="flex h-[18px] items-center text-[10px] text-muted-foreground">
                  {label}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-1 overflow-x-auto">
              {weeks.map((weekStart, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const date = new Date(weekStart)
                    date.setDate(date.getDate() + dayIndex)
                    const dateStr = format(date, 'yyyy-MM-dd')
                    const data = dataMap.get(dateStr)
                    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')

                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-[18px] w-[18px] rounded-sm transition-all hover:ring-2 hover:ring-foreground/30 ${
                              isToday ? 'ring-2 ring-primary' : ''
                            }`}
                            style={{
                              backgroundColor: data
                                ? getPnlColor(data.pnl, maxAbsPnl)
                                : 'hsl(var(--secondary))',
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="border-border bg-card text-foreground"
                        >
                          <p className="text-xs font-medium">{format(date, 'MMM dd, yyyy')}</p>
                          {data && data.trades > 0 ? (
                            <>
                              <p className={`font-mono text-xs ${data.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {formatCurrency(data.pnl)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{data.trades} trade(s)</p>
                            </>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">No trades</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
