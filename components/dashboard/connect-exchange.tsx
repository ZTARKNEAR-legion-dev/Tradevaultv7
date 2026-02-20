'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Wallet, Link2, Upload, ShieldCheck, ArrowRight, Zap, BarChart3, Plus, Lightbulb } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  walletConnected: boolean
  liveTradeCount: number
  isLoading: boolean
  onConnectWallet: () => void
  onUpload: () => void
}

interface ExchangeInfo {
  id: 'binance' | 'bybit'
  name: string
  color: string
  fields: string[]
}

const EXCHANGES: ExchangeInfo[] = [
  { id: 'binance', name: 'Binance Futures', color: 'text-amber-500', fields: ['API Key', 'Secret Key'] },
  { id: 'bybit', name: 'Bybit', color: 'text-orange-400', fields: ['API Key', 'Secret Key'] },
]

export function ConnectExchangeDialog({
  open,
  onClose,
  walletConnected,
  liveTradeCount,
  isLoading,
  onConnectWallet,
  onUpload,
}: Props) {
  const [comingSoon, setComingSoon] = useState<'wallet' | 'binance' | 'bybit' | null>(null)

  function handleBack() {
    setComingSoon(null)
  }

  // Coming Soon Modal
  if (comingSoon) {
    const data = {
      wallet: { title: 'Phantom Wallet Integration', icon: Wallet, color: 'text-blue-500' },
      binance: { title: 'Binance Futures Integration', icon: Link2, color: 'text-amber-500' },
      bybit: { title: 'Bybit Integration', icon: Link2, color: 'text-orange-400' },
    }
    const { title, icon: Icon, color } = data[comingSoon]

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md border-border bg-card p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-3">
            <button onClick={handleBack} className="mb-3 text-left text-xs font-semibold text-primary hover:underline">
              ← Back
            </button>
            <DialogTitle className="text-base font-bold text-foreground">{title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Coming in the next update</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 pb-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex flex-col items-center text-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">This integration is in development</p>
                <p className="mt-1 text-[10px] text-muted-foreground">We're building seamless connections to all major exchanges and wallets.</p>
              </div>
            </div>

            <div className="rounded-lg bg-secondary/40 border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                In the meantime:
              </p>
              <ul className="text-[10px] text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Try <span className="font-semibold text-foreground">Demo Mode</span> to explore all analytics features with sample data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Add <span className="font-semibold text-foreground">manual trades</span> to test the journal, analysis, and risk metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Upload your <span className="font-semibold text-foreground">CSV/Excel</span> from any exchange for instant analysis</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => { handleBack(); onUpload() }}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground transition-all hover:brightness-110"
            >
              <Upload className="h-3.5 w-3.5" />
              Import from CSV/Excel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border bg-card p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-bold text-foreground">Import Your Trades</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">Choose how to bring your trade history into TradeVault.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 px-5 pb-5">
          {/* Option 1: Wallet (on-chain) */}
          <button
            onClick={() => setComingSoon('wallet')}
            className="group flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.03]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">Phantom Wallet</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-semibold text-muted-foreground">Coming Soon</span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Auto-detect swaps on Jupiter, Raydium, Orca, Drift</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Option 2: CEX Exchanges */}
          {EXCHANGES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setComingSoon(ex.id as 'binance' | 'bybit')}
              className="group flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.03]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Link2 className={`h-4 w-4 ${ex.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{ex.name}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-semibold text-muted-foreground">Coming Soon</span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Connect with read-only API key</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}

          {/* Option 3: CSV Upload - ACTIVE */}
          <div className="relative pt-1">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <button
              onClick={() => { onClose(); onUpload() }}
              className="group relative flex items-center gap-3 rounded-xl border-2 border-primary/40 bg-primary/[0.03] px-4 py-3.5 text-left transition-all hover:border-primary/60 hover:bg-primary/[0.08]"
            >
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-profit/10 px-2 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-profit opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-profit" />
                </span>
                <span className="text-[7px] font-bold text-profit uppercase">Active</span>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <Upload className="h-4 w-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-foreground">Upload CSV / Excel</span>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Import from any exchange or tracker</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Quick Tips */}
          <div className="mt-2 rounded-lg bg-secondary/50 px-3 py-2.5">
            <p className="flex items-center gap-2 text-[9px] font-semibold text-muted-foreground mb-1.5">
              <Zap className="h-3 w-3 text-primary" />
              Quick Start:
            </p>
            <ul className="space-y-1 text-[8px] text-muted-foreground/80">
              <li className="flex items-center gap-1">
                <Plus className="h-2.5 w-2.5 text-primary/60" />
                Add manual trades with the <span className="font-semibold">+ button</span>
              </li>
              <li className="flex items-center gap-1">
                <BarChart3 className="h-2.5 w-2.5 text-primary/60" />
                Instantly see PnL, win rate, and risk metrics
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
