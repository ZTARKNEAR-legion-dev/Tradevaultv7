'use client'

import { useState, useEffect } from 'react'
import { useData, type TraderLevel } from '@/components/providers/data-provider'
import { WalletsModal } from '@/components/wallets-modal'
import { ComingSoonModal } from '@/components/coming-soon-modal'
import { ConfirmModal } from '@/components/confirm-modal'
import { CSVUploadModal } from '@/components/csv-upload-modal'
import { Logo } from '@/components/logo'
import { Sun, Moon, Wallet, GraduationCap, Zap, Database, Trash2, ChevronDown, TrendingUp } from 'lucide-react'

export type { TraderLevel }

export function DashboardHeader({ onHome, traderLevel, onToggleLevel, onImport }: { onHome?: () => void; traderLevel: TraderLevel; onToggleLevel: () => void; onImport?: () => void }) {
  const { mode, manualTradeCount, clearManualTrades } = useData()
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [mounted, setMounted] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showWalletsModal, setShowWalletsModal] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showCSVUpload, setShowCSVUpload] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme, mounted])

  return (
    <header className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5">
      {/* Left: brand with modern logo */}
      <button onClick={onHome} className="flex items-center gap-2 transition-all hover:opacity-90 active:scale-95">
        <Logo />
        <span className="text-[8px] leading-tight text-muted-foreground font-medium hidden sm:block">
          {mode === 'real' ? 'Live' : mode === 'upload' ? 'Journal' : 'Demo'}
        </span>
      </button>

      {/* Right: theme + wallet balance box + connect */}
      <div className="flex items-center gap-2">
        {/* Beginner / Pro toggle */}
        <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
          <button
            onClick={traderLevel === 'pro' ? onToggleLevel : undefined}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
              traderLevel === 'beginner'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="h-3 w-3" />
            <span className="hidden sm:inline">Simple</span>
          </button>
          <button
            onClick={traderLevel === 'beginner' ? onToggleLevel : undefined}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
              traderLevel === 'pro'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="h-3 w-3" />
            <span className="hidden sm:inline">Pro</span>
          </button>
        </div>

        {/* Import data */}
        <button
          onClick={() => setShowCSVUpload(true)}
          className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.06] px-2.5 py-1.5 text-[10px] font-semibold text-primary transition-all hover:bg-primary/10"
        >
          <Database className="h-3 w-3" />
          <span className="hidden sm:inline">Import Data</span>
        </button>

        {/* Settings menu */}
        {manualTradeCount > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] font-semibold text-foreground transition-all hover:bg-secondary"
            >
              <span>{manualTradeCount} manual</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 rounded-lg border border-border bg-card p-2 shadow-lg">
                <button
                  onClick={() => {
                    setShowClearConfirm(true)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-[10px] font-semibold text-loss transition-colors hover:bg-loss/10"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear manual trades
                </button>
              </div>
            )}
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Toggle theme"
        >
          {mounted ? (theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />) : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Wallet balance box (only in real mode when connected) */}
        {mode === 'real' && (
          <div className="hidden items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5 sm:flex">
            <span className="text-[11px] font-semibold text-foreground">Real Mode</span>
          </div>
        )}

        {/* Connect button - Opens wallets modal */}
        <button
          onClick={() => setShowWalletsModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-110 active:brightness-95"
          title="Click to see wallet connection options"
        >
          <Wallet className="h-3.5 w-3.5" />
          Connect Wallet
        </button>

        {/* Mode labels */}
        {mode === 'demo' && (
          <div className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
            Demo Data
          </div>
        )}
        {mode === 'upload' && (
          <div className="rounded-lg border border-[#a78bfa]/20 bg-[#a78bfa]/[0.06] px-3 py-1.5 text-[11px] font-medium text-[#a78bfa]">
            Uploaded
          </div>
        )}
      </div>

      <WalletsModal open={showWalletsModal} onClose={() => setShowWalletsModal(false)} />
      <ComingSoonModal 
        open={showComingSoon} 
        onClose={() => setShowComingSoon(false)}
        feature="CSV Import and Exchange Integration"
      />
      <ConfirmModal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearManualTrades}
        title="Clear All Manual Trades?"
        message="This will permanently delete all manually added trades. This action cannot be undone."
        confirmText="Yes, Delete All"
        cancelText="Keep Trades"
        variant="danger"
      />
      <CSVUploadModal
        open={showCSVUpload}
        onClose={() => setShowCSVUpload(false)}
        onUploadSuccess={() => {
          setShowCSVUpload(false)
        }}
      />
    </header>
  )
}
