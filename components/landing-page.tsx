'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Upload, Shield, Zap, Lock, Moon, Sun, ArrowRight, Play, BarChart3 } from 'lucide-react'
import { Logo } from '@/components/logo'
import { WalletsModal } from '@/components/wallets-modal'

interface Props {
  onDemo: () => void
  onReal: () => void
  onUpload: () => void
}

const features = [
  { icon: BarChart3, title: 'Smart Analytics', desc: 'AI-powered insights on your trades with detailed performance breakdowns.' },
  { icon: Upload, title: 'CSV Auto-Detect', desc: 'Upload any exchange CSV - columns are detected and mapped automatically.' },
  { icon: Shield, title: 'Privacy First', desc: 'All data stays in your browser. Nothing is sent to external servers.' },
  { icon: Zap, title: 'Instant Results', desc: 'Get PnL charts, win rates, risk metrics and streaks in milliseconds.' },
  { icon: Lock, title: 'Wallet Ready', desc: 'Phantom, Binance, Ledger integration coming soon for live data.' },
  { icon: TrendingUp, title: 'Trade Journal', desc: 'Log trades manually, add notes, track your improvement over time.' },
]

export function LandingPage({ onDemo, onReal, onUpload }: Props) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showWalletsModal, setShowWalletsModal] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const dark = saved === 'dark'
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.classList.toggle('light', !isDark)
  }, [isDark, mounted])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="rounded-full p-2.5 transition-colors hover:bg-secondary" aria-label="Toggle theme">
              {mounted ? (isDark ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />) : <Moon className="h-4 w-4 text-foreground" />}
            </button>
            <button
              onClick={() => setShowWalletsModal(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium text-primary">Built for Deriverse Hackathon</span>
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Your Trading
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Command Center
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-pretty text-base text-muted-foreground sm:text-lg md:text-xl leading-relaxed">
            Upload your trade history, get instant analytics, track your performance,
            and become a better trader. Privacy-first -- all data stays local.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={onDemo}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:brightness-110 sm:w-auto"
            >
              <Play className="h-4 w-4" />
              Try Demo
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              disabled
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/50 px-8 py-3.5 text-sm font-bold text-muted-foreground cursor-not-allowed sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              Coming Soon
            </button>
            <button
              onClick={() => setShowWalletsModal(true)}
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-sm font-bold text-foreground transition-all hover:bg-secondary sm:w-auto"
            >
              <Lock className="h-4 w-4" />
              Connect Wallet
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex flex-col items-center"><span className="text-2xl font-bold text-foreground">50+</span><span className="text-xs">Supported Exchanges</span></div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center"><span className="text-2xl font-bold text-foreground">100%</span><span className="text-xs">{'Local & Private'}</span></div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center"><span className="text-2xl font-bold text-foreground">Free</span><span className="text-xs">Open Source</span></div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 bg-card/50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">Everything You Need</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Powerful analytics tools designed for serious traders.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 px-4 py-6">
        <div className="mx-auto max-w-7xl flex items-center justify-center">
          <Logo />
        </div>
      </footer>

      <WalletsModal open={showWalletsModal} onClose={() => setShowWalletsModal(false)} />
    </div>
  )
}
