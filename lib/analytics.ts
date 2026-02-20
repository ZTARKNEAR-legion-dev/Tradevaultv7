/**
 * TradeVault Analytics Library
 * 
 * Comprehensive trading analytics and metrics calculation utilities.
 * Provides functions for performance analysis, risk metrics, and data visualization.
 * 
 * @version 1.3
 * @author TradeVault Team
 */

import { format, getDay, getHours, startOfDay, eachDayOfInterval, subDays } from 'date-fns'
import type {
  Trade,
  TradeMetrics,
  DailyPnl,
  SymbolVolume,
  FeeBreakdown,
  SessionPerformance,
  HourlyPerformance,
  OrderTypePerformance,
  DrawdownPoint,
  StreakData,
  RiskMetrics,
  CalendarDay,
  DashboardFilters,
} from './types'

// --- Filtering ---

/**
 * Filters trades based on multiple criteria including symbol, side, order type, and date range.
 * 
 * @param trades - Array of trades to filter
 * @param filters - Filter criteria to apply
 * @returns Filtered array of trades matching all specified criteria
 * 
 * @example
 * const btcTrades = filterTrades(allTrades, {
 *   symbol: 'BTC-PERP',
 *   side: 'long',
 *   orderType: 'all',
 *   dateRange: { from: new Date('2024-01-01'), to: new Date('2024-12-31') }
 * })
 */
export function filterTrades(trades: Trade[], filters: DashboardFilters): Trade[] {
  return trades.filter((t) => {
    if (filters.symbol !== 'all' && t.symbol !== filters.symbol) return false
    if (filters.side !== 'all' && t.side !== filters.side) return false
    if (filters.orderType !== 'all' && t.orderType !== filters.orderType) return false
    if (filters.dateRange.from && t.exitTime < filters.dateRange.from) return false
    if (filters.dateRange.to) {
      const endOfDay = new Date(filters.dateRange.to)
      endOfDay.setHours(23, 59, 59, 999)
      if (t.exitTime > endOfDay) return false
    }
    return true
  })
}

// --- Core Metrics ---

/**
 * Calculates comprehensive trading metrics including PnL, win rate, profit factor, and more.
 * 
 * This is the core analytics function that computes all key performance indicators
 * displayed throughout the dashboard. Handles empty trade arrays gracefully.
 * 
 * @param trades - Array of trades to analyze
 * @returns Complete metrics object with all calculated statistics
 * 
 * @remarks
 * - Returns zero-filled metrics for empty trade arrays
 * - Handles division by zero for win rate, profit factor, etc.
 * - Separates long and short position performance
 * - Calculates both absolute PnL and percentage returns
 * 
 * @example
 * const metrics = calculateMetrics(myTrades)
 * console.log(`Win Rate: ${metrics.winRate.toFixed(1)}%`)
 * console.log(`Profit Factor: ${metrics.profitFactor.toFixed(2)}`)
 */
export function calculateMetrics(trades: Trade[]): TradeMetrics {
  if (trades.length === 0) {
    return {
      totalPnl: 0, totalPnlPercent: 0, winRate: 0, totalTrades: 0,
      winningTrades: 0, losingTrades: 0, averageWin: 0, averageLoss: 0,
      largestWin: 0, largestLoss: 0, profitFactor: 0, averageRiskReward: 0,
      longCount: 0, shortCount: 0, longPnl: 0, shortPnl: 0,
      totalVolume: 0, totalFees: 0,
    }
  }

  const wins = trades.filter((t) => t.pnl > 0)
  const losses = trades.filter((t) => t.pnl <= 0)
  const totalVolume = trades.reduce((s, t) => s + t.notionalValue, 0)
  const totalFees = trades.reduce((s, t) => s + t.fees.total, 0)
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const longs = trades.filter((t) => t.side === 'long')
  const shorts = trades.filter((t) => t.side === 'short')

  return {
    totalPnl,
    totalPnlPercent: totalVolume > 0 ? (totalPnl / totalVolume) * 100 : 0,
    winRate: (wins.length / trades.length) * 100,
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    averageWin: wins.length > 0 ? grossProfit / wins.length : 0,
    averageLoss: losses.length > 0 ? grossLoss / losses.length : 0,
    largestWin: wins.length > 0 ? Math.max(...wins.map((t) => t.pnl)) : 0,
    largestLoss: losses.length > 0 ? Math.min(...losses.map((t) => t.pnl)) : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    averageRiskReward: grossLoss > 0 && losses.length > 0 && wins.length > 0
      ? (grossProfit / wins.length) / (grossLoss / losses.length) : 0,
    longCount: longs.length,
    shortCount: shorts.length,
    longPnl: longs.reduce((s, t) => s + t.pnl, 0),
    shortPnl: shorts.reduce((s, t) => s + t.pnl, 0),
    totalVolume,
    totalFees,
  }
}

// --- Daily PnL ---
export function calculateDailyPnl(trades: Trade[]): DailyPnl[] {
  if (!trades || trades.length === 0) return []

  try {
    // Convert all dates to proper Date objects and filter out invalid ones
    const validTrades = trades
      .map(t => ({
        ...t,
        exitTime: new Date(t.exitTime)
      }))
      .filter(t => {
        const time = t.exitTime.getTime()
        return typeof time === 'number' && time > 0 && isFinite(time)
      })

    if (validTrades.length === 0) return []

    const sorted = validTrades.sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime())
    
    // Safely get earliest and latest dates with error handling
    let earliest, latest
    try {
      earliest = startOfDay(sorted[0].exitTime)
      latest = startOfDay(sorted[sorted.length - 1].exitTime)
      
      if (!earliest || !latest || isNaN(earliest.getTime()) || isNaN(latest.getTime())) {
        return []
      }
    } catch {
      return []
    }
    
    const days = eachDayOfInterval({ start: earliest, end: latest })
    if (!Array.isArray(days) || days.length === 0) return []

    const dailyMap = new Map<string, { pnl: number; trades: number }>()
    for (const day of days) {
      dailyMap.set(format(day, 'yyyy-MM-dd'), { pnl: 0, trades: 0 })
    }

    for (const trade of sorted) {
      try {
        const dayStart = startOfDay(trade.exitTime)
        const key = format(dayStart, 'yyyy-MM-dd')
        const existing = dailyMap.get(key)
        if (existing) {
          existing.pnl += trade.pnl
          existing.trades += 1
        }
      } catch {
        continue
      }
    }

    let cumulative = 0
    return Array.from(dailyMap.entries()).map(([date, data]) => {
      cumulative += data.pnl
      return { date, pnl: data.pnl, cumulativePnl: cumulative, trades: data.trades }
    })
  } catch (err) {
    return []
  }
}

// --- Volume by Symbol ---
export function calculateVolumeBySymbol(trades: Trade[]): SymbolVolume[] {
  const map = new Map<string, { volume: number; trades: number; pnl: number }>()
  for (const t of trades) {
    const existing = map.get(t.symbol) || { volume: 0, trades: 0, pnl: 0 }
    existing.volume += t.notionalValue
    existing.trades += 1
    existing.pnl += t.pnl
    map.set(t.symbol, existing)
  }
  return Array.from(map.entries())
    .map(([symbol, data]) => ({ symbol, ...data }))
    .sort((a, b) => b.volume - a.volume)
}

// --- Fee Breakdown ---
export function calculateFeeBreakdown(trades: Trade[]): FeeBreakdown {
  return trades.reduce(
    (acc, t) => ({
      trading: acc.trading + t.fees.trading,
      funding: acc.funding + t.fees.funding,
      total: acc.total + t.fees.total,
    }),
    { trading: 0, funding: 0, total: 0 }
  )
}

// --- Session Performance ---
export function calculateSessionPerformance(trades: Trade[]): SessionPerformance[] {
  const sessions: Record<string, { pnl: number; trades: number; wins: number }> = {
    'Asia (00-08)': { pnl: 0, trades: 0, wins: 0 },
    'London (08-16)': { pnl: 0, trades: 0, wins: 0 },
    'New York (16-24)': { pnl: 0, trades: 0, wins: 0 },
  }

  for (const t of trades) {
    try {
      const time = new Date(t.entryTime)
      if (isNaN(time.getTime())) continue
      const hour = getHours(time)
      const session = hour < 8 ? 'Asia (00-08)' : hour < 16 ? 'London (08-16)' : 'New York (16-24)'
      sessions[session].pnl += t.pnl
      sessions[session].trades += 1
      if (t.pnl > 0) sessions[session].wins += 1
    } catch {
      continue
    }
  }

  return Object.entries(sessions).map(([session, data]) => ({
    session,
    pnl: data.pnl,
    trades: data.trades,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
  }))
}

export function calculateHourlyPerformance(trades: Trade[]): HourlyPerformance[] {
  const hourly: Record<number, { pnl: number; trades: number; wins: number }> = {}
  for (let i = 0; i < 24; i++) {
    hourly[i] = { pnl: 0, trades: 0, wins: 0 }
  }

  for (const t of trades) {
    try {
      const time = new Date(t.entryTime)
      if (isNaN(time.getTime())) continue
      const hour = getHours(time)
      hourly[hour].pnl += t.pnl
      hourly[hour].trades += 1
      if (t.pnl > 0) hourly[hour].wins += 1
    } catch {
      continue
    }
  }

  return Object.entries(hourly).map(([hour, data]) => ({
    hour: parseInt(hour),
    pnl: data.pnl,
    trades: data.trades,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
  }))
}

// --- Order Type Performance ---
export function calculateOrderTypePerformance(trades: Trade[]): OrderTypePerformance[] {
  const types: Record<string, { trades: number; pnl: number; wins: number }> = {
    market: { trades: 0, pnl: 0, wins: 0 },
    limit: { trades: 0, pnl: 0, wins: 0 },
    stop: { trades: 0, pnl: 0, wins: 0 },
  }

  for (const t of trades) {
    types[t.orderType].trades += 1
    types[t.orderType].pnl += t.pnl
    if (t.pnl > 0) types[t.orderType].wins += 1
  }

  return Object.entries(types)
    .filter(([, data]) => data.trades > 0)
    .map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      trades: data.trades,
      pnl: data.pnl,
      winRate: (data.wins / data.trades) * 100,
      avgPnl: data.pnl / data.trades,
    }))
}

// --- Drawdown ---

/**
 * Calculates drawdown points over time, showing peak-to-trough declines.
 * 
 * Tracks cumulative PnL and identifies the percentage decline from each peak.
 * Used to measure the largest losing streak and portfolio volatility.
 * 
 * @param trades - Array of trades sorted by exit time
 * @returns Array of drawdown points with dates, drawdown percentages, and cumulative PnL
 * 
 * @example
 * const drawdowns = calculateDrawdown(trades)
 * const maxDrawdown = Math.min(...drawdowns.map(d => d.drawdown))
 */
export function calculateDrawdown(trades: Trade[]): DrawdownPoint[] {
  const dailyPnl = calculateDailyPnl(trades)
  if (dailyPnl.length === 0) return []

  let peak = 0
  return dailyPnl.map((day) => {
    if (day.cumulativePnl > peak) peak = day.cumulativePnl
    const drawdown = peak > 0 ? ((day.cumulativePnl - peak) / peak) * 100 : 0
    return { date: day.date, drawdown, cumulativePnl: day.cumulativePnl }
  })
}

// --- Streaks ---
export function calculateStreaks(trades: Trade[]): StreakData[] {
  if (!trades || trades.length === 0) return []

  try {
    // Convert to Date objects and filter valid ones
    const validTrades = trades
      .map(t => ({
        ...t,
        exitTime: new Date(t.exitTime)
      }))
      .filter(t => !isNaN(t.exitTime.getTime()))
      .sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime())

    if (validTrades.length === 0) return []

    const streaks: StreakData[] = []
    let currentType: 'win' | 'loss' = validTrades[0].pnl > 0 ? 'win' : 'loss'
    let count = 1
    let pnl = validTrades[0].pnl
    let startDate = format(validTrades[0].exitTime, 'yyyy-MM-dd')

    for (let i = 1; i < validTrades.length; i++) {
      const isWin = validTrades[i].pnl > 0
      if ((isWin && currentType === 'win') || (!isWin && currentType === 'loss')) {
        count++
        pnl += validTrades[i].pnl
      } else {
        streaks.push({ type: currentType, count, pnl, startDate, endDate: format(validTrades[i - 1].exitTime, 'yyyy-MM-dd') })
        currentType = isWin ? 'win' : 'loss'
        count = 1
        pnl = validTrades[i].pnl
        startDate = format(validTrades[i].exitTime, 'yyyy-MM-dd')
      }
    }
    streaks.push({ type: currentType, count, pnl, startDate, endDate: format(validTrades[validTrades.length - 1].exitTime, 'yyyy-MM-dd') })

    return streaks
  } catch (err) {
    return []
  }
}

// --- Risk Metrics ---

/**
 * Calculates advanced risk-adjusted performance metrics for portfolio analysis.
 * 
 * Computes key risk metrics including Sharpe Ratio, Sortino Ratio, maximum drawdown,
 * volatility, and expectancy. These metrics help assess risk-adjusted returns and
 * portfolio quality beyond simple profit/loss.
 * 
 * @param trades - Array of trades to analyze (minimum 2 required)
 * @returns Comprehensive risk metrics object
 * 
 * @remarks
 * **Calculated Metrics:**
 * - **Sharpe Ratio**: Risk-adjusted return (higher is better, >1 is good)
 * - **Sortino Ratio**: Similar to Sharpe but only penalizes downside volatility
 * - **Max Drawdown**: Largest peak-to-trough decline in portfolio value
 * - **Volatility**: Annualized standard deviation of returns
 * - **Expectancy**: Average expected profit/loss per trade
 * - **Calmar Ratio**: Return divided by max drawdown
 * 
 * Returns zero-filled object for arrays with fewer than 2 trades.
 * 
 * @example
 * const risk = calculateRiskMetrics(trades)
 * if (risk.sharpeRatio > 2) {
 *   console.log('Excellent risk-adjusted returns!')
 * }
 */
export function calculateRiskMetrics(trades: Trade[]): RiskMetrics {
  if (trades.length < 2) {
    return {
      sharpeRatio: 0, sortinoRatio: 0, maxDrawdown: 0, maxDrawdownPercent: 0,
      averageRiskReward: 0, calmarRatio: 0, volatility: 0, expectancy: 0,
    }
  }

  const returns = trades.map((t) => t.pnlPercent)
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (returns.length - 1)
  const stdDev = Math.sqrt(variance)

  const negativeReturns = returns.filter((r) => r < 0)
  const downsideVariance = negativeReturns.length > 0
    ? negativeReturns.reduce((s, r) => s + Math.pow(r, 2), 0) / negativeReturns.length
    : 0
  const downsideDev = Math.sqrt(downsideVariance)

  const drawdownPoints = calculateDrawdown(trades)
  const maxDrawdownPercent = drawdownPoints.length > 0
    ? Math.min(...drawdownPoints.map((d) => d.drawdown))
    : 0

  const sorted = [...trades].sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime())
  let peak = 0
  let maxDd = 0
  let cumPnl = 0
  for (const t of sorted) {
    cumPnl += t.pnl
    if (cumPnl > peak) peak = cumPnl
    const dd = peak - cumPnl
    if (dd > maxDd) maxDd = dd
  }

  const wins = trades.filter((t) => t.pnl > 0)
  const losses = trades.filter((t) => t.pnl <= 0)
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0
  const winRate = wins.length / trades.length

  const annualizedReturn = mean * 252
  const annualizedStdDev = stdDev * Math.sqrt(252)

  return {
    sharpeRatio: annualizedStdDev > 0 ? annualizedReturn / annualizedStdDev : 0,
    sortinoRatio: downsideDev > 0 ? (mean * Math.sqrt(252)) / (downsideDev * Math.sqrt(252)) : 0,
    maxDrawdown: maxDd,
    maxDrawdownPercent: Math.abs(maxDrawdownPercent),
    averageRiskReward: avgLoss > 0 ? avgWin / avgLoss : 0,
    calmarRatio: maxDd > 0 ? (trades.reduce((s, t) => s + t.pnl, 0) / maxDd) : 0,
    volatility: annualizedStdDev,
    expectancy: (winRate * avgWin) - ((1 - winRate) * avgLoss),
  }
}

// --- Calendar Heatmap ---

/**
 * Generates calendar heatmap data for the last 90 days of trading activity.
 * 
 * Creates a daily breakdown of PnL and trade count, filling in empty days with
 * zero values. Used for the performance calendar visualization.
 * 
 * @param trades - Array of trades to aggregate by day
 * @returns Array of calendar days with PnL and trade counts
 * 
 * @remarks
 * - Covers last 90 days from current date
 * - Groups trades by exit date
 * - Handles invalid dates gracefully with try-catch
 * - Returns empty array for invalid inputs
 */
export function calculateCalendarData(trades: Trade[]): CalendarDay[] {
  if (!trades || trades.length === 0) return []

  try {
    const now = new Date()
    const start = subDays(now, 90)
    const days = eachDayOfInterval({ start, end: now })

    const map = new Map<string, { pnl: number; trades: number }>()
    for (const day of days) {
      map.set(format(day, 'yyyy-MM-dd'), { pnl: 0, trades: 0 })
    }

    for (const t of trades) {
      try {
        const exitTime = new Date(t.exitTime)
        if (isNaN(exitTime.getTime())) continue
        const key = format(startOfDay(exitTime), 'yyyy-MM-dd')
        const existing = map.get(key)
        if (existing) {
          existing.pnl += t.pnl
          existing.trades += 1
        }
      } catch {
        continue
      }
    }

    return Array.from(map.entries()).map(([date, data]) => ({
      date,
      pnl: data.pnl,
      trades: data.trades,
    }))
  } catch (err) {
    return []
  }
}

// --- Day of Week Performance ---
export function calculateDayOfWeekPerformance(trades: Trade[]): { day: string; pnl: number; trades: number; winRate: number }[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayData: Record<number, { pnl: number; trades: number; wins: number }> = {}
  for (let i = 0; i < 7; i++) dayData[i] = { pnl: 0, trades: 0, wins: 0 }

  for (const t of trades) {
    const day = getDay(t.exitTime)
    dayData[day].pnl += t.pnl
    dayData[day].trades += 1
    if (t.pnl > 0) dayData[day].wins += 1
  }

  return Object.entries(dayData).map(([day, data]) => ({
    day: dayNames[parseInt(day)],
    pnl: data.pnl,
    trades: data.trades,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
  }))
}

// --- Cumulative Fee Tracking ---
export function calculateCumulativeFees(trades: Trade[]): { date: string; cumulativeFee: number; tradingFee: number; fundingFee: number }[] {
  const sorted = [...trades].sort((a, b) => a.exitTime.getTime() - b.exitTime.getTime())
  let cumFee = 0
  let cumTrading = 0
  let cumFunding = 0

  return sorted.map((t) => {
    cumFee += t.fees.total
    cumTrading += t.fees.trading
    cumFunding += t.fees.funding
    return {
      date: format(t.exitTime, 'MMM dd'),
      cumulativeFee: cumFee,
      tradingFee: cumTrading,
      fundingFee: cumFunding,
    }
  })
}

// --- Day Win Rate + Best Strategy Per Day ---
export function calculateDayWinRate(trades: Trade[]): import('./types').DayWinRate[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayData: Record<number, { trades: Trade[]; wins: number; pnl: number }> = {}
  for (let i = 0; i < 7; i++) dayData[i] = { trades: [], wins: 0, pnl: 0 }

  for (const t of trades) {
    const day = getDay(t.exitTime)
    dayData[day].trades.push(t)
    dayData[day].pnl += t.pnl
    if (t.pnl > 0) dayData[day].wins += 1
  }

  return Object.entries(dayData).map(([dayIdx, data]) => {
    const idx = parseInt(dayIdx)
    const total = data.trades.length
    const winRate = total > 0 ? (data.wins / total) * 100 : 0

    // Find best strategy for this day
    const stratMap = new Map<string, { wins: number; total: number }>()
    for (const t of data.trades) {
      const s = t.strategy || 'Unknown'
      const existing = stratMap.get(s) || { wins: 0, total: 0 }
      existing.total += 1
      if (t.pnl > 0) existing.wins += 1
      stratMap.set(s, existing)
    }

    let bestStrategy: string | null = null
    let bestStrategyWinRate = 0
    for (const [strat, sdata] of stratMap) {
      if (sdata.total >= 2) {
        const swr = (sdata.wins / sdata.total) * 100
        if (swr > bestStrategyWinRate) {
          bestStrategy = strat
          bestStrategyWinRate = swr
        }
      }
    }

    return {
      day: dayNames[idx],
      dayIndex: idx,
      totalTrades: total,
      wins: data.wins,
      winRate,
      pnl: data.pnl,
      bestStrategy,
      bestStrategyWinRate,
    }
  })
}

// --- Strategy Performance ---
export function calculateStrategyPerformance(trades: Trade[]): import('./types').StrategyPerformance[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const stratMap = new Map<string, { trades: Trade[]; wins: number; pnl: number }>()

  for (const t of trades) {
    const s = t.strategy || 'Unknown'
    const existing = stratMap.get(s) || { trades: [], wins: 0, pnl: 0 }
    existing.trades.push(t)
    existing.pnl += t.pnl
    if (t.pnl > 0) existing.wins += 1
    stratMap.set(s, existing)
  }

  return Array.from(stratMap.entries()).map(([strategy, data]) => {
    // Best/worst day for this strategy
    const dayPerf = new Map<number, { wins: number; total: number }>()
    for (const t of data.trades) {
      const d = getDay(t.exitTime)
      const existing = dayPerf.get(d) || { wins: 0, total: 0 }
      existing.total += 1
      if (t.pnl > 0) existing.wins += 1
      dayPerf.set(d, existing)
    }

    let bestDay: string | null = null
    let worstDay: string | null = null
    let bestDayWinRate = -1
    let worstDayWinRate = 101

    // Count days with enough trades
    const eligibleDays = Array.from(dayPerf.entries()).filter(([, dp]) => dp.total >= 2)

    for (const [d, dp] of eligibleDays) {
      const wr = (dp.wins / dp.total) * 100
      if (wr > bestDayWinRate) { 
        bestDayWinRate = wr
        bestDay = dayNames[d]
      }
      if (wr < worstDayWinRate) { 
        worstDayWinRate = wr
        worstDay = dayNames[d]
      }
    }

    // Only show worst day if it's different from best day (multiple eligible days)
    if (eligibleDays.length < 2 || bestDay === worstDay) {
      worstDay = null
    }

    return {
      strategy,
      trades: data.trades.length,
      wins: data.wins,
      winRate: data.trades.length > 0 ? (data.wins / data.trades.length) * 100 : 0,
      pnl: data.pnl,
      avgPnl: data.trades.length > 0 ? data.pnl / data.trades.length : 0,
      bestDay,
      worstDay,
      bestDayWinRate: bestDayWinRate >= 0 ? bestDayWinRate : 0,
      worstDayWinRate: worstDayWinRate <= 100 ? worstDayWinRate : 0,
    }
  }).sort((a, b) => b.winRate - a.winRate)
}

// --- Format Helpers ---

/**
 * Formats a numeric value as USD currency with optional compact notation.
 * 
 * @param value - Numeric value to format
 * @param compact - If true, displays values ≥1000 as "K" notation (e.g., "$1.2K")
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, true) // "$1.2K"
 * formatCurrency(-500) // "-$500.00"
 */
export function formatCurrency(value: number, compact?: boolean): string {
  if (compact && Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats a percentage value with sign and 2 decimal places.
 * 
 * @param value - Percentage value (e.g., 12.5 for 12.5%)
 * @returns Formatted percentage string with + or - sign
 * 
 * @example
 * formatPercent(12.5) // "+12.50%"
 * formatPercent(-3.2) // "-3.20%"
 */
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

/**
 * Formats a number with locale-specific thousands separators.
 * 
 * @param value - Numeric value to format
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234.567) // "1,234.57"
 * formatNumber(42) // "42"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
