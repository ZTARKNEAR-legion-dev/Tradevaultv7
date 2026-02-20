'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { subDays } from 'date-fns'
import { mockTrades, SYMBOLS } from '@/lib/mock-data'
import { filterTrades } from '@/lib/analytics'
import { secureStorage } from '@/lib/crypto'
import type { Trade, DashboardFilters, DataSource } from '@/lib/types'

export type AppMode = 'demo' | 'real' | 'upload'
export type TraderLevel = 'beginner' | 'pro'

interface DataContextValue {
  trades: Trade[]
  filteredTrades: Trade[]
  filters: DashboardFilters
  updateFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void
  dataSource: DataSource
  mode: AppMode
  symbols: string[]
  isLoading: boolean
  annotations: Record<string, string>
  setAnnotation: (tradeId: string, note: string) => void
  uploadedTradeCount: number
  traderLevel: TraderLevel
  isPro: boolean
  addManualTrade: (trade: Trade) => void
  editTrade: (tradeId: string, updates: Partial<Trade>) => void
  manualTradeCount: number
  clearManualTrades: () => void
  walletAddress: string | null
  walletBalance: number | null
}

const DataContext = createContext<DataContextValue | null>(null)

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

interface ProviderProps {
  mode: AppMode
  uploadedTrades?: Trade[]
  traderLevel?: TraderLevel
  children: ReactNode
}

export function DataProvider({ mode, uploadedTrades, traderLevel = 'beginner', children }: ProviderProps) {
  const [annotations, setAnnotations] = useState<Record<string, string>>({})
  const [manualTrades, setManualTrades] = useState<Trade[]>([])
  const [editedDemoTrades, setEditedDemoTrades] = useState<Record<string, Trade>>({})
  const [hasLoadedLocalStorage, setHasLoadedLocalStorage] = useState(false)

  const [filters, setFilters] = useState<DashboardFilters>({
    symbol: 'all',
    dateRange: { from: subDays(new Date(), 90), to: new Date() },
    side: 'all',
    orderType: 'all',
  })

  useEffect(() => {
    if (hasLoadedLocalStorage) return
    const loadTrades = async () => {
      try {
        // Try encrypted storage first
        const saved = await secureStorage.getItem('tradervault_manual_trades')
        if (saved) {
          const trades = JSON.parse(saved) as Trade[]
          const fixedTrades = trades.map((t) => ({
            ...t,
            entryTime: new Date(t.entryTime),
            exitTime: new Date(t.exitTime),
          }))
          setManualTrades(fixedTrades)
        }
      } catch { /* ignore */ }
      setHasLoadedLocalStorage(true)
    }
    loadTrades()
  }, [hasLoadedLocalStorage])

  const trades = useMemo(() => {
    let baseTrades: Trade[]
    if (mode === 'upload' && uploadedTrades && uploadedTrades.length > 0) {
      baseTrades = uploadedTrades
    } else {
      baseTrades = mockTrades.map(t => editedDemoTrades[t.id] || t)
    }
    const allTrades = [...baseTrades, ...manualTrades]
    allTrades.sort((a, b) => {
      const aTime = a.exitTime instanceof Date ? a.exitTime.getTime() : new Date(a.exitTime).getTime()
      const bTime = b.exitTime instanceof Date ? b.exitTime.getTime() : new Date(b.exitTime).getTime()
      return bTime - aTime
    })
    return allTrades.map((t) => ({
      ...t,
      notes: annotations[t.id] || t.notes,
    }))
  }, [mode, uploadedTrades, manualTrades, editedDemoTrades, annotations])

  const symbols = useMemo(() => {
    const s = [...new Set(trades.map((t) => t.symbol))]
    s.sort()
    return s
  }, [trades])

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [trades, filters])
  const dataSource: DataSource = 'mock'

  const updateFilter = useCallback(<K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setAnnotation = useCallback((tradeId: string, note: string) => {
    setAnnotations((prev) => ({ ...prev, [tradeId]: note }))
  }, [])

  const addManualTrade = useCallback((trade: Trade) => {
    setManualTrades((prev) => {
      const updated = [trade, ...prev]
      secureStorage.setItem('tradervault_manual_trades', JSON.stringify(updated)).catch(() => {
        // Fallback to regular localStorage if encryption fails
        try { localStorage.setItem('tradervault_manual_trades', JSON.stringify(updated)) } catch { /* ignore */ }
      })
      return updated
    })
  }, [])

  const editTrade = useCallback((tradeId: string, updates: Partial<Trade>) => {
    // Check if it's a manual trade
    setManualTrades((prev) => {
      const tradeIndex = prev.findIndex((t) => t.id === tradeId)
      if (tradeIndex === -1) return prev
      
      const trade = prev[tradeIndex]
      const updated = { ...trade, ...updates }
      
      // Recalculate PnL if entry/exit prices or size changed
      if (updates.entryPrice !== undefined || updates.exitPrice !== undefined || updates.size !== undefined || updates.notionalValue !== undefined) {
        const entryPrice = updates.entryPrice ?? trade.entryPrice
        const exitPrice = updates.exitPrice ?? trade.exitPrice
        const size = updates.size ?? trade.size
        const notionalValue = updates.notionalValue ?? trade.notionalValue
        const side = updates.side ?? trade.side
        
        const priceDiff = side === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice
        const pnl = (priceDiff / entryPrice) * notionalValue - (updated.fees?.total ?? trade.fees.total)
        const pnlPercent = (pnl / notionalValue) * 100
        
        updated.pnl = pnl
        updated.pnlPercent = pnlPercent
      }
      
      const newTrades = [...prev]
      newTrades[tradeIndex] = updated
      
      secureStorage.setItem('tradervault_manual_trades', JSON.stringify(newTrades)).catch(() => {
        try { localStorage.setItem('tradervault_manual_trades', JSON.stringify(newTrades)) } catch { /* ignore */ }
      })
      return newTrades
    })
    
    // Check if it's a demo trade
    const demoTrade = mockTrades.find(t => t.id === tradeId)
    if (demoTrade) {
      setEditedDemoTrades((prev) => {
        const updated = { ...demoTrade, ...updates }
        
        // Recalculate PnL if entry/exit prices or size changed
        if (updates.entryPrice !== undefined || updates.exitPrice !== undefined || updates.size !== undefined || updates.notionalValue !== undefined) {
          const entryPrice = updates.entryPrice ?? demoTrade.entryPrice
          const exitPrice = updates.exitPrice ?? demoTrade.exitPrice
          const size = updates.size ?? demoTrade.size
          const notionalValue = updates.notionalValue ?? demoTrade.notionalValue
          const side = updates.side ?? demoTrade.side
          
          const priceDiff = side === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice
          const pnl = (priceDiff / entryPrice) * notionalValue - (updated.fees?.total ?? demoTrade.fees.total)
          const pnlPercent = (pnl / notionalValue) * 100
          
          updated.pnl = pnl
          updated.pnlPercent = pnlPercent
        }
        
        return { ...prev, [tradeId]: updated }
      })
    }
  }, [])

  const clearManualTrades = useCallback(() => {
    setManualTrades([])
    secureStorage.removeItem('tradervault_manual_trades')
  }, [])

  const value: DataContextValue = useMemo(
    () => ({
      trades,
      filteredTrades,
      filters,
      updateFilter,
      dataSource,
      mode,
      symbols,
      isLoading: false,
      annotations,
      setAnnotation,
      uploadedTradeCount: uploadedTrades?.length ?? 0,
      traderLevel,
      isPro: traderLevel === 'pro',
      addManualTrade,
      editTrade,
      manualTradeCount: manualTrades.length,
      clearManualTrades,
      walletAddress: null,
      walletBalance: null,
    }),
    [trades, filteredTrades, filters, updateFilter, dataSource, mode, symbols, annotations, setAnnotation, uploadedTrades?.length, traderLevel, addManualTrade, editTrade, manualTrades.length, clearManualTrades]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
