'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/components/providers/data-provider'
import { calculateRiskMetrics, formatCurrency } from '@/lib/analytics'
import { Shield, AlertTriangle, TrendingUp, Zap, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  quality,
  info,
}: {
  label: string
  value: string
  sub?: string
  icon: typeof Shield
  quality: 'good' | 'neutral' | 'bad'
  info?: string
}) {
  const colorMap = {
    good: 'text-profit',
    neutral: 'text-foreground',
    bad: 'text-loss',
  }
  const bgMap = {
    good: 'bg-profit/10',
    neutral: 'bg-secondary',
    bad: 'bg-loss/10',
  }

  return (
    <div className={`group flex items-start gap-3 rounded-xl p-3.5 transition-all hover:scale-[1.02] ${bgMap[quality]}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgMap[quality]}`}>
        <Icon className={`h-4 w-4 ${colorMap[quality]}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {info && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{info}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className={`font-mono text-lg font-bold leading-tight ${colorMap[quality]}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

export function RiskMetricsPanel() {
  const { filteredTrades, isPro } = useData()
  const risk = useMemo(() => calculateRiskMetrics(filteredTrades), [filteredTrades])
  const simple = !isPro

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-foreground">{simple ? 'How Safe Are You?' : 'Risk Metrics'}</CardTitle>
          {simple && <p className="mt-0.5 text-[10px] text-muted-foreground/70 italic">{'These numbers show how risky your trading style is. Green = safe, red = risky.'}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label={simple ? 'Return Quality' : 'Sharpe Ratio'}
            value={risk.sharpeRatio.toFixed(2)}
            sub={simple
              ? (risk.sharpeRatio > 1 ? 'Great! You earn well for the risk you take.' : risk.sharpeRatio > 0 ? 'Okay, but you could earn more safely.' : 'You\'re taking too much risk for your returns.')
              : (risk.sharpeRatio > 1 ? 'Good risk-adjusted return' : risk.sharpeRatio > 0 ? 'Moderate' : 'Underperforming')
            }
            icon={Shield}
            quality={risk.sharpeRatio > 1 ? 'good' : risk.sharpeRatio > 0 ? 'neutral' : 'bad'}
            info="Measures how much return you get for each unit of risk. Above 1.0 is good, above 2.0 is excellent. Higher = better risk-adjusted returns."
          />
          <MetricCard
            label={simple ? 'Biggest Drop' : 'Max Drawdown'}
            value={formatCurrency(risk.maxDrawdown)}
            sub={simple
              ? `Your account dropped ${risk.maxDrawdownPercent.toFixed(1)}% from its highest point.`
              : `${risk.maxDrawdownPercent.toFixed(1)}% from peak`
            }
            icon={AlertTriangle}
            quality={risk.maxDrawdownPercent < 10 ? 'good' : risk.maxDrawdownPercent < 25 ? 'neutral' : 'bad'}
            info="The largest peak-to-trough decline in your account value. Shows the worst losing streak you experienced. Lower is better."
          />
          <MetricCard
            label={simple ? 'Win vs Loss Size' : 'Risk/Reward'}
            value={risk.averageRiskReward.toFixed(2)}
            sub={simple
              ? (risk.averageRiskReward > 1.5 ? 'Your wins are bigger than your losses!' : 'Try to let winners run longer.')
              : (risk.averageRiskReward > 1.5 ? 'Favorable ratio' : 'Needs improvement')
            }
            icon={TrendingUp}
            quality={risk.averageRiskReward > 1.5 ? 'good' : risk.averageRiskReward > 1 ? 'neutral' : 'bad'}
            info="Ratio of average winning trade to average losing trade. Above 1.5 means your wins are significantly bigger than your losses."
          />
          <MetricCard
            label={simple ? 'Avg. Per Trade' : 'Expectancy'}
            value={formatCurrency(risk.expectancy)}
            sub={simple
              ? (risk.expectancy > 0 ? 'On average, each trade earns you this much.' : 'On average, each trade loses you money.')
              : 'Expected PnL per trade'
            }
            icon={Zap}
            quality={risk.expectancy > 0 ? 'good' : 'bad'}
            info="The average amount you can expect to make (or lose) per trade. Calculated as (Win% × Avg Win) - (Loss% × Avg Loss). Positive is profitable."
          />
          {isPro && (
            <>
              <MetricCard
                label="Sortino Ratio"
                value={risk.sortinoRatio.toFixed(2)}
                sub="Downside risk adjusted"
                icon={Shield}
                quality={risk.sortinoRatio > 1 ? 'good' : risk.sortinoRatio > 0 ? 'neutral' : 'bad'}
                info="Similar to Sharpe Ratio but only penalizes downside volatility (losses). Ignores upside volatility. Above 1.0 is good, above 2.0 is excellent."
              />
              <MetricCard
                label="Volatility"
                value={`${risk.volatility.toFixed(1)}%`}
                sub="Annualized"
                icon={AlertTriangle}
                quality={risk.volatility < 30 ? 'good' : risk.volatility < 60 ? 'neutral' : 'bad'}
                info="Measures how much your returns fluctuate. Higher volatility means bigger swings in your PnL. Lower volatility = more consistent returns."
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
