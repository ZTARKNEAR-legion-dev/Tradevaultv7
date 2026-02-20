'use client'

import { useMemo } from 'react'
import { useData } from '@/components/providers/data-provider'
import { calculateMetrics, formatCurrency, formatPercent } from '@/lib/analytics'
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Scale,
  ArrowUpDown,
  DollarSign,
  Zap,
  type LucideIcon,
} from 'lucide-react'

function StatCard({
  label,
  value,
  sub,
  hint,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  sub?: string
  hint?: string
  icon: LucideIcon
  color: 'profit' | 'loss' | 'primary' | 'default'
}) {
  const colorMap = {
    profit: 'text-profit',
    loss: 'text-loss',
    primary: 'text-primary',
    default: 'text-foreground',
  }
  const bgMap = {
    profit: 'bg-profit/10',
    loss: 'bg-loss/10',
    primary: 'bg-primary/10',
    default: 'bg-secondary',
  }

  return (
    <div className={`group flex items-start gap-3 rounded-xl p-3.5 transition-all hover:scale-[1.02] ${bgMap[color]}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgMap[color]}`}>
        <Icon className={`h-4 w-4 ${colorMap[color]}`} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`font-mono text-lg font-bold leading-tight ${colorMap[color]}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        {hint && <p className="mt-0.5 text-xs text-muted-foreground/70 italic">{hint}</p>}
      </div>
    </div>
  )
}

export function StatsOverview({ onShowTrade }: { onShowTrade?: (tradeId: string) => void }) {
  const { filteredTrades, isPro } = useData()
  const m = useMemo(() => calculateMetrics(filteredTrades), [filteredTrades])
  const simple = !isPro

  const largestWinTrade = useMemo(() => filteredTrades.reduce((max, t) => t.pnl > max.pnl ? t : max, filteredTrades[0] || null), [filteredTrades])
  const largestLossTrade = useMemo(() => filteredTrades.reduce((min, t) => t.pnl < min.pnl ? t : min, filteredTrades[0] || null), [filteredTrades])

  return (
    <div className="flex flex-col gap-3">
      {/* Top hero row: PnL + Win Rate + Trades */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Total PnL - featured */}
        <div className={`rounded-xl p-3.5 transition-all hover:scale-[1.02] ${
          m.totalPnl >= 0 ? 'bg-profit/10' : 'bg-loss/10'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.totalPnl >= 0 ? 'bg-profit/10' : 'bg-loss/10'}`}>
              {m.totalPnl >= 0 ? <TrendingUp className="h-4 w-4 text-profit" /> : <TrendingDown className="h-4 w-4 text-loss" />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total PnL</p>
              <p className={`mt-1 font-mono text-lg font-bold leading-tight ${m.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatCurrency(m.totalPnl)}
              </p>
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                m.totalPnl >= 0 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
              }`}>
                {formatPercent(m.totalPnlPercent)}
              </span>
              {simple && <p className="mt-0.5 text-xs text-muted-foreground/70 italic">{'This is your total profit or loss from all trades combined.'}</p>}
            </div>
          </div>
        </div>

        {/* Win Rate - with ring */}
        <div className="flex items-start gap-3 rounded-xl bg-secondary p-3.5 transition-all hover:scale-[1.02]">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="hsl(var(--border))" strokeWidth="2.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke={m.winRate >= 50 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
                strokeWidth="2.5" strokeDasharray={`${m.winRate}, 100`} strokeLinecap="round"
              />
            </svg>
            <span className={`absolute font-mono text-xs font-bold ${m.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
              {m.winRate.toFixed(0)}%
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Win Rate</p>
            <p className="mt-1 font-mono text-lg font-bold leading-tight text-foreground">
              {m.winningTrades}W / {m.losingTrades}L
            </p>
            <p className="text-xs text-muted-foreground">{m.totalTrades} total</p>
            {simple && <p className="mt-0.5 text-xs text-muted-foreground/70 italic">{'How many of your trades made money.'}</p>}
          </div>
        </div>

        {/* Profit Factor */}
        <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-3.5 transition-all hover:scale-[1.02]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Profit Factor</p>
            <p className={`mt-1 font-mono text-lg font-bold leading-tight ${m.profitFactor >= 1.5 ? 'text-profit' : m.profitFactor >= 1 ? 'text-foreground' : 'text-loss'}`}>
              {m.profitFactor === Infinity ? 'Perfect' : m.profitFactor.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Gain / Loss ratio</p>
            {simple && <p className="mt-0.5 text-xs text-muted-foreground/70 italic">{'Above 1.0 means your wins are bigger than your losses. Higher is better!'}</p>}
          </div>
        </div>
      </div>

      {/* Full metrics grid -- all visible, no collapse */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Average Win" value={formatCurrency(m.averageWin)} icon={TrendingUp} color="profit" hint={simple ? 'How much you earn per winning trade on average.' : undefined} />
        <StatCard label="Average Loss" value={formatCurrency(m.averageLoss)} icon={TrendingDown} color="loss" hint={simple ? 'How much you lose per losing trade on average.' : undefined} />
        <button
          onClick={() => largestWinTrade && onShowTrade?.(largestWinTrade.id)}
          className="text-left transition-all hover:scale-[1.02]"
        >
          <StatCard label="Largest Win" value={formatCurrency(m.largestWin)} icon={Zap} color="profit" hint={simple ? 'Your single best trade so far. Click to view!' : undefined} />
        </button>
        <button
          onClick={() => largestLossTrade && onShowTrade?.(largestLossTrade.id)}
          className="text-left transition-all hover:scale-[1.02]"
        >
          <StatCard label="Largest Loss" value={formatCurrency(m.largestLoss)} icon={Zap} color="loss" hint={simple ? 'Your single worst trade. Click to view!' : undefined} />
        </button>
        <StatCard label="Total Volume" value={formatCurrency(m.totalVolume, true)} icon={ArrowUpDown} color="primary" hint={simple ? 'Total money you moved across all trades.' : undefined} />
        <StatCard label="Total Fees" value={formatCurrency(m.totalFees)} icon={DollarSign} color="default" hint={simple ? 'Amount paid to the exchange in fees.' : undefined} />
        <StatCard label={simple ? 'Bought (Long)' : 'Long Trades'} value={m.longCount.toString()} sub={formatCurrency(m.longPnl)} icon={BarChart3} color="profit" hint={simple ? 'Trades where you bet the price would go UP.' : undefined} />
        <StatCard label={simple ? 'Sold (Short)' : 'Short Trades'} value={m.shortCount.toString()} sub={formatCurrency(m.shortPnl)} icon={Target} color="loss" hint={simple ? 'Trades where you bet the price would go DOWN.' : undefined} />
      </div>
    </div>
  )
}
