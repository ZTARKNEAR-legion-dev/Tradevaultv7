'use client'

import { useState } from 'react'
import { useData } from '@/components/providers/data-provider'
import { subDays } from 'date-fns'
import { SlidersHorizontal, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FilterBar() {
  const { filters, updateFilter, symbols } = useData()
  const [expanded, setExpanded] = useState(false)
  const [activeRange, setActiveRange] = useState('90D')

  const ranges = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: 'All', days: 0 },
  ]

  const hasFilter = filters.symbol !== 'all' || filters.side !== 'all' || filters.orderType !== 'all'

  function handleRange(label: string, days: number) {
    setActiveRange(label)
    updateFilter('dateRange', days === 0 ? { from: null, to: null } : { from: subDays(new Date(), days), to: new Date() })
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Date range */}
      <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
        {ranges.map((r) => (
          <button
            key={r.label}
            onClick={() => handleRange(r.label, r.days)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-all ${
              activeRange === r.label
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Filter toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex h-7 items-center gap-1 rounded-lg border px-2 text-[10px] font-bold transition-all ${
          expanded || hasFilter
            ? 'border-primary/20 bg-primary/5 text-primary'
            : 'border-border bg-card text-muted-foreground hover:text-foreground'
        }`}
      >
        <SlidersHorizontal className="h-3 w-3" />
        <span className="hidden sm:inline">Filter</span>
        {hasFilter && (
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
            {[filters.symbol !== 'all', filters.side !== 'all', filters.orderType !== 'all'].filter(Boolean).length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="flex items-center gap-1.5">
          <Select value={filters.symbol} onValueChange={(v) => updateFilter('symbol', v)}>
            <SelectTrigger className="h-7 w-[90px] rounded-lg border-border bg-card text-[10px] shadow-none">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Symbols</SelectItem>
              {symbols.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.side} onValueChange={(v) => updateFilter('side', v as 'all' | 'long' | 'short')}>
            <SelectTrigger className="h-7 w-[70px] rounded-lg border-border bg-card text-[10px] shadow-none">
              <SelectValue placeholder="Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.orderType} onValueChange={(v) => updateFilter('orderType', v as 'all' | 'market' | 'limit' | 'stop')}>
            <SelectTrigger className="h-7 w-[70px] rounded-lg border-border bg-card text-[10px] shadow-none">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="limit">Limit</SelectItem>
              <SelectItem value="stop">Stop</SelectItem>
            </SelectContent>
          </Select>

          {hasFilter && (
            <button
              onClick={() => { updateFilter('symbol', 'all'); updateFilter('side', 'all'); updateFilter('orderType', 'all') }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-loss/10 text-loss hover:bg-loss/20"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
