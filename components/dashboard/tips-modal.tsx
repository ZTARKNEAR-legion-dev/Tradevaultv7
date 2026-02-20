'use client'

import { useData } from '@/components/providers/data-provider'
import { calculateMetrics, calculateDayWinRate, calculateStrategyPerformance, formatCurrency } from '@/lib/analytics'
import { Lightbulb, TrendingUp, Calendar, Target, ShieldCheck, AlertTriangle, X } from 'lucide-react'

interface Insight {
  icon: typeof TrendingUp
  text: string
  type: 'good' | 'warning' | 'tip'
}

function generateInsights(trades: import('@/lib/types').Trade[]): Insight[] {
  if (trades.length === 0) return []

  const metrics = calculateMetrics(trades)
  const dayWinRates = calculateDayWinRate(trades)
  const stratPerf = calculateStrategyPerformance(trades)
  const insights: Insight[] = []

  // Win rate insight
  if (metrics.winRate >= 70) {
    insights.push({ icon: TrendingUp, text: `You win ${metrics.winRate.toFixed(0)}% of your trades -- that's excellent! Keep doing what works.`, type: 'good' })
  } else if (metrics.winRate >= 50) {
    insights.push({ icon: TrendingUp, text: `Your win rate is ${metrics.winRate.toFixed(0)}% -- above average. Focus on cutting losers faster.`, type: 'tip' })
  } else {
    insights.push({ icon: AlertTriangle, text: `Your win rate is ${metrics.winRate.toFixed(0)}%. Consider tightening entries or using wider stops.`, type: 'warning' })
  }

  // Best day insight
  const activeDays = dayWinRates.filter((d) => d.totalTrades >= 2)
  if (activeDays.length > 0) {
    const best = activeDays.reduce((a, b) => a.winRate > b.winRate ? a : b)
    if (best.winRate > 0) {
      insights.push({ icon: Calendar, text: `Your best day is ${best.day} with ${best.winRate.toFixed(0)}% win rate. Trade more on this day!`, type: 'good' })
    }
  }

  // Best strategy insight
  if (stratPerf.length > 0) {
    const best = stratPerf[0]
    if (best.winRate > 0) {
      insights.push({ icon: Target, text: `${best.strategy} is your strongest strategy with ${best.winRate.toFixed(0)}% wins. Use it more!`, type: 'good' })
    }
  }

  // Risk reward
  if (metrics.averageWin > 0 && metrics.averageLoss > 0) {
    const ratio = metrics.averageWin / metrics.averageLoss
    if (ratio >= 2) {
      insights.push({ icon: ShieldCheck, text: `Your avg win (${formatCurrency(metrics.averageWin)}) is ${ratio.toFixed(1)}x your avg loss (${formatCurrency(metrics.averageLoss)}) -- great risk management!`, type: 'good' })
    } else if (ratio < 1) {
      insights.push({ icon: AlertTriangle, text: `Your losses are bigger than your wins. Try to let winners run longer.`, type: 'warning' })
    }
  }

  // Profit factor
  if (metrics.profitFactor >= 2) {
    insights.push({ icon: TrendingUp, text: `Profit factor of ${metrics.profitFactor.toFixed(1)} means for every $1 lost, you make $${metrics.profitFactor.toFixed(1)} -- that's strong.`, type: 'good' })
  }

  return insights.slice(0, 6)
}

const typeStyles = {
  good: 'border-profit/20 bg-profit/[0.04]',
  warning: 'border-loss/20 bg-loss/[0.04]',
  tip: 'border-primary/20 bg-primary/[0.04]',
}
const iconStyles = {
  good: 'text-profit',
  warning: 'text-loss',
  tip: 'text-primary',
}

export function TipsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { filteredTrades } = useData()
  const insights = generateInsights(filteredTrades)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Lightbulb className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Tips For You</h2>
              <p className="text-xs text-muted-foreground">We looked at your trades and found these helpful tips</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Add some trades to see personalized tips!</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.map((insight, i) => {
                const Icon = insight.icon
                return (
                  <div key={i} className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${typeStyles[insight.type]}`}>
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconStyles[insight.type]}`} />
                    <p className="text-sm leading-relaxed text-foreground/90">{insight.text}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
