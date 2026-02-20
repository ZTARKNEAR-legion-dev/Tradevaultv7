export interface Trade {
  id: string
  symbol: string
  side: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  size: number
  notionalValue: number
  entryTime: Date
  exitTime: Date
  orderType: 'market' | 'limit' | 'stop'
  fees: {
    trading: number
    funding: number
    total: number
  }
  pnl: number
  pnlPercent: number
  strategy?: string
  notes: string
  leverage: number
  liquidated: boolean
  source: 'live' | 'mock' | 'manual'
  exchange?: string
}

export interface DashboardFilters {
  symbol: string
  dateRange: { from: Date | null; to: Date | null }
  side: 'all' | 'long' | 'short'
  orderType: 'all' | 'market' | 'limit' | 'stop'
}

export interface TradeMetrics {
  totalPnl: number
  totalPnlPercent: number
  winRate: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  profitFactor: number
  averageRiskReward: number
  longCount: number
  shortCount: number
  longPnl: number
  shortPnl: number
  totalVolume: number
  totalFees: number
}

export interface DailyPnl {
  date: string
  pnl: number
  cumulativePnl: number
  trades: number
}

export interface SymbolVolume {
  symbol: string
  volume: number
  trades: number
  pnl: number
}

export interface FeeBreakdown {
  trading: number
  funding: number
  total: number
}

export interface SessionPerformance {
  session: string
  pnl: number
  trades: number
  winRate: number
}

export interface HourlyPerformance {
  hour: number
  pnl: number
  trades: number
  winRate: number
}

export interface OrderTypePerformance {
  type: string
  trades: number
  pnl: number
  winRate: number
  avgPnl: number
}

export interface DrawdownPoint {
  date: string
  drawdown: number
  cumulativePnl: number
}

export interface StreakData {
  type: 'win' | 'loss'
  count: number
  pnl: number
  startDate: string
  endDate: string
}

export interface RiskMetrics {
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  maxDrawdownPercent: number
  averageRiskReward: number
  calmarRatio: number
  volatility: number
  expectancy: number
}

export interface CalendarDay {
  date: string
  pnl: number
  trades: number
}

export interface DayWinRate {
  day: string
  dayIndex: number
  totalTrades: number
  wins: number
  winRate: number
  pnl: number
  bestStrategy: string | null
  bestStrategyWinRate: number
}

export interface StrategyPerformance {
  strategy: string
  trades: number
  wins: number
  winRate: number
  pnl: number
  avgPnl: number
  bestDay: string | null
  worstDay: string | null
  bestDayWinRate: number
  worstDayWinRate: number
}

export type DataSource = 'live' | 'mock'
