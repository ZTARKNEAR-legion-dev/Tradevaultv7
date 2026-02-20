'use client'

import { useState, useCallback, useTransition } from 'react'
import { DataProvider, useData, type AppMode } from '@/components/providers/data-provider'
import { LandingPage } from '@/components/landing-page'
import { UploadModal } from '@/components/upload-modal'
import { DashboardHeader, type TraderLevel } from '@/components/dashboard/header'
import { DayStrategyAnalysis } from '@/components/dashboard/day-strategy-analysis'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { PnlChart } from '@/components/dashboard/pnl-chart'
import { WinLossAnalysis } from '@/components/dashboard/win-loss-analysis'
import { LongShortRatio } from '@/components/dashboard/long-short-ratio'
import { VolumeFeeChart } from '@/components/dashboard/volume-fee-chart'
import { SymbolPnlBreakdown } from '@/components/dashboard/symbol-pnl-breakdown'
import { OrderTypeAnalysis } from '@/components/dashboard/order-type-analysis'
import { TimeAnalysis } from '@/components/dashboard/time-analysis'
import { PerformanceHeatmap } from '@/components/dashboard/performance-heatmap'
import { StreakTracker } from '@/components/dashboard/streak-tracker'
import { RiskMetricsPanel } from '@/components/dashboard/risk-metrics'
import { TradeJournal } from '@/components/dashboard/trade-journal'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { AddTradeManual } from '@/components/dashboard/add-trade-manual'
import { TipsModal } from '@/components/dashboard/tips-modal'
import { ExchangeAnalysis } from '@/components/dashboard/exchange-analysis'
import { SecureBackup } from '@/components/dashboard/secure-backup'
import { BarChart3, PieChart, BookOpen, ShieldCheck, Info, X, AlertCircle, Upload, Loader2, Plus, Lightbulb } from 'lucide-react'
import type { Trade } from '@/lib/types'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'analysis', label: 'Analysis', icon: PieChart },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'risk', label: 'Risk', icon: ShieldCheck },
] as const
type TabId = (typeof tabs)[number]['id']

function ModeBanner() {
  const [show, setShow] = useState(true)
  const { mode, uploadedTradeCount, manualTradeCount } = useData()
  if (!show) return null

  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
      mode === 'demo'
        ? 'border border-primary/10 bg-primary/[0.03]'
        : mode === 'upload'
        ? 'border border-[#a78bfa]/15 bg-[#a78bfa]/[0.03]'
        : 'border border-primary/15 bg-primary/[0.03]'
    }`}>
      {mode === 'upload' ? (
        <Upload className="h-3 w-3 shrink-0 text-[#a78bfa]" />
      ) : mode === 'demo' ? (
        <Info className="h-3 w-3 shrink-0 text-primary" />
      ) : (
        <Info className="h-3 w-3 shrink-0 text-primary" />
      )}
      <p className="flex-1 text-[10px] text-muted-foreground">
        {mode === 'demo' ? (
          <><span className="font-semibold text-foreground">Demo Mode</span>{' -- Viewing sample trades.'}</>
        ) : mode === 'upload' ? (
          <><span className="font-semibold text-[#a78bfa]">Uploaded Data</span>{` -- ${uploadedTradeCount} trades loaded from your file.`}</>
        ) : (
          <><span className="font-semibold text-foreground">Real Mode</span>{' -- Ready to connect wallet.'}</>
        )}
        {manualTradeCount > 0 && ` + ${manualTradeCount} manual trades.`}
      </p>
      <button onClick={() => setShow(false)} className="text-muted-foreground/40 hover:text-foreground"><X className="h-3 w-3" /></button>
    </div>
  )
}

function Dashboard({ onHome, traderLevel, onToggleLevel, onOpenConnect, onUpload }: { onHome: () => void; traderLevel: TraderLevel; onToggleLevel: () => void; onOpenConnect: () => void; onUpload: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showManualTrade, setShowManualTrade] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const { mode, addManualTrade, isPro } = useData()
  
  const handleShowTrade = useCallback((tradeId: string) => {
    setActiveTab('journal')
    // Scroll to trade after a brief delay for tab switch
    setTimeout(() => {
      const tradeElement = document.querySelector(`[data-trade-id="${tradeId}"]`)
      tradeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [])

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-3 sm:px-5">
      <div className="flex flex-col gap-2.5">
        <DashboardHeader onHome={onHome} traderLevel={traderLevel} onToggleLevel={onToggleLevel} onImport={onOpenConnect} />
        <ModeBanner />

        {/* Tabs + filters in one row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex items-center rounded-lg bg-card border border-border p-0.5">
            {tabs.map((t) => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {t.label}
                </button>
              )
            })}
          </nav>
          <FilterBar />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2.5">
          {activeTab === 'overview' && (
            <>
              <StatsOverview onShowTrade={handleShowTrade} />
              <PnlChart />
              <DayStrategyAnalysis />
              <div className="grid gap-2.5 lg:grid-cols-2">
                <WinLossAnalysis />
                <LongShortRatio />
              </div>
              <PerformanceHeatmap />
            </>
          )}
          {activeTab === 'analysis' && (
            <>
              <div className="grid gap-2.5 lg:grid-cols-2">
                <SymbolPnlBreakdown />
                <OrderTypeAnalysis />
              </div>
              <TimeAnalysis />
              <VolumeFeeChart />
              <StreakTracker />
              <ExchangeAnalysis />
            </>
          )}
          {activeTab === 'journal' && <TradeJournal />}
          {activeTab === 'risk' && (
            <>
              <RiskMetricsPanel />
              <StreakTracker />
              <SecureBackup />
            </>
          )}
        </div>


      </div>

      {showManualTrade && (
        <AddTradeManual
          onAdd={addManualTrade}
          onClose={() => setShowManualTrade(false)}
        />
      )}

      {/* Floating Action Button - Tips (bottom-left) */}
      <button
        onClick={() => setShowTips(true)}
        className="group fixed bottom-6 left-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3.5 text-white shadow-lg shadow-amber-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/60 active:scale-95"
        aria-label="View trading tips"
      >
        <Lightbulb className="h-6 w-6 fill-current" />
        {!isPro && <span className="text-sm font-bold">Tips</span>}
      </button>

      {/* Floating Action Button - Add Trade (bottom-right) */}
      <button
        onClick={() => setShowManualTrade(true)}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
        aria-label="Add manual trade"
      >
        <Plus className="h-5 w-5" />
        {!isPro && <span className="text-xs font-semibold">Add Trade</span>}
      </button>

      <TipsModal open={showTips} onClose={() => setShowTips(false)} />
    </div>
  )
}

export default function Page() {
  const [view, setView] = useState<'landing' | AppMode>('landing')
  const [showConnect, setShowConnect] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadedTrades, setUploadedTrades] = useState<Trade[]>([])
  const [traderLevel, setTraderLevel] = useState<TraderLevel>('beginner')
  const [isPending, startTransition] = useTransition()

  // Instant view switching with useTransition - no remounting
  const goDemo = useCallback(() => startTransition(() => setView('demo')), [])
  const goReal = useCallback(() => startTransition(() => setView('real')), [])
  const goHome = useCallback(() => startTransition(() => { setView('landing'); setUploadedTrades([]) }), [])
  const toggleLevel = useCallback(() => setTraderLevel((p) => p === 'beginner' ? 'pro' : 'beginner'), [])
  const openConnect = useCallback(() => setShowConnect(true), [])
  const openUpload = useCallback(() => { setShowConnect(false); setShowUpload(true) }, [])
  const closeUpload = useCallback(() => setShowUpload(false), [])

  const handleParsed = useCallback((trades: Trade[]) => {
    setUploadedTrades(trades)
    setShowUpload(false)
    startTransition(() => setView('upload'))
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <DataProvider 
        mode={view === 'landing' ? 'demo' : (view as AppMode)} 
        uploadedTrades={uploadedTrades.length > 0 ? uploadedTrades : undefined}
        traderLevel={traderLevel}
      >
        {view === 'landing' && (
          <LandingPage onDemo={goDemo} onReal={goReal} onUpload={openConnect} />
        )}
        
        {view !== 'landing' && (
          <Dashboard onHome={goHome} traderLevel={traderLevel} onToggleLevel={toggleLevel} onOpenConnect={openConnect} onUpload={openUpload} />
        )}

        <UploadModal open={showUpload} onClose={closeUpload} onParsed={handleParsed} onTryDemo={goDemo} />
      </DataProvider>
    </main>
  )
}
