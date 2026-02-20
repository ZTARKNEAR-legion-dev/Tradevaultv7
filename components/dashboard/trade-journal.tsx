'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/components/providers/data-provider'
import { EditTradeModal } from '@/components/dashboard/edit-trade-modal'
import { formatCurrency, formatPercent } from '@/lib/analytics'
import { format } from 'date-fns'
import type { Trade } from '@/lib/types'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  X,
  Download,
  FileX2,
  Edit,
} from 'lucide-react'

type SortKey = 'exitTime' | 'symbol' | 'side' | 'pnl' | 'size' | 'entryPrice' | 'exitPrice'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 15

export function TradeJournal() {
  const { filteredTrades, setAnnotation, isPro } = useData()
  const simple = !isPro
  const [sortKey, setSortKey] = useState<SortKey>('exitTime')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)

  const sorted = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'exitTime':
          cmp = a.exitTime.getTime() - b.exitTime.getTime()
          break
        case 'symbol':
          cmp = a.symbol.localeCompare(b.symbol)
          break
        case 'side':
          cmp = a.side.localeCompare(b.side)
          break
        case 'pnl':
          cmp = a.pnl - b.pnl
          break
        case 'size':
          cmp = a.notionalValue - b.notionalValue
          break
        case 'entryPrice':
          cmp = a.entryPrice - b.entryPrice
          break
        case 'exitPrice':
          cmp = a.exitPrice - b.exitPrice
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filteredTrades, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  function startEdit(tradeId: string, currentNote: string) {
    setEditingId(tradeId)
    setEditValue(currentNote)
  }

  function saveEdit(tradeId: string) {
    setAnnotation(tradeId, editValue)
    setEditingId(null)
  }

  function exportCSV() {
    const headers = ['Date', 'Symbol', 'Side', 'Type', 'Entry Price', 'Exit Price', 'Size', 'Trading Fee', 'Funding Fee', 'Total Fee', 'PnL', 'PnL %', 'Leverage', 'Notes']
    const rows = sorted.map((t) => [
      format(t.exitTime, 'yyyy-MM-dd HH:mm'),
      t.symbol,
      t.side,
      t.orderType,
      t.entryPrice.toString(),
      t.exitPrice.toString(),
      t.notionalValue.toFixed(2),
      t.fees.trading.toFixed(2),
      t.fees.funding.toFixed(2),
      t.fees.total.toFixed(2),
      t.pnl.toFixed(2),
      t.pnlPercent.toFixed(2),
      t.leverage.toString(),
      `"${t.notes.replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `deriverse-trades-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function SortHeader({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) {
    const isActive = sortKey === sortKeyName
    return (
      <button
        onClick={() => handleSort(sortKeyName)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        {isActive ? (
          sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    )
  }

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-foreground">{simple ? 'Your Trade History' : 'Trade Journal'}</CardTitle>
          <p className="text-xs text-muted-foreground">{filteredTrades.length} trades{simple ? ' -- every trade you made, in one place' : ''}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            className="flex items-center gap-1.5 rounded-lg bg-secondary/70 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary disabled:opacity-40"
            onClick={exportCSV}
            disabled={filteredTrades.length === 0}
          >
            <Download className="h-3 w-3" />
            Export CSV
          </button>
          <span>
            Page {page + 1} of {totalPages || 1}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {filteredTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileX2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No trades found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your filters or date range to see trade data. Or add a manual trade using the + button.
            </p>
          </div>
        ) : null}
        <table className={`w-full ${simple ? 'min-w-[600px]' : 'min-w-[900px]'} text-xs ${filteredTrades.length === 0 ? 'hidden' : ''}`}>
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left"><SortHeader label={simple ? 'When' : 'Date'} sortKeyName="exitTime" /></th>
              <th className="pb-2 text-left"><SortHeader label={simple ? 'Coin' : 'Symbol'} sortKeyName="symbol" /></th>
              <th className="pb-2 text-left"><SortHeader label={simple ? 'Buy/Sell' : 'Side'} sortKeyName="side" /></th>
              {!simple && <th className="pb-2 text-right">Type</th>}
              {!simple && <th className="pb-2 text-right"><SortHeader label="Entry" sortKeyName="entryPrice" /></th>}
              {!simple && <th className="pb-2 text-right"><SortHeader label="Exit" sortKeyName="exitPrice" /></th>}
              <th className="pb-2 text-right"><SortHeader label={simple ? 'Amount' : 'Size'} sortKeyName="size" /></th>
              {!simple && <th className="pb-2 text-right">Fees</th>}
              <th className="pb-2 text-right"><SortHeader label={simple ? 'Profit/Loss' : 'PnL'} sortKeyName="pnl" /></th>
              <th className="pb-2 text-left pl-3">Notes</th>
              <th className="pb-2 text-center w-[60px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((trade) => (
              <tr
                key={trade.id}
                className="border-b border-border/50 transition-colors hover:bg-secondary/50"
              >
                <td className="py-2.5 font-mono text-muted-foreground">
                  {format(trade.exitTime, 'MMM dd HH:mm')}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div>
                      <span className="font-medium text-foreground">{trade.symbol.replace('-PERP', '')}</span>
                      <span className="text-muted-foreground">-PERP</span>
                    </div>
                    {trade.source === 'manual' && (
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[9px] text-primary">
                        Manual
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-2.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      trade.side === 'long'
                        ? 'border-profit/30 text-profit'
                        : 'border-loss/30 text-loss'
                    }`}
                  >
                    {simple ? (trade.side === 'long' ? 'BUY' : 'SELL') : trade.side.toUpperCase()}
                  </Badge>
                </td>
                {!simple && <td className="py-2.5 text-right capitalize text-muted-foreground">{trade.orderType}</td>}
                {!simple && (
                  <td className="py-2.5 text-right font-mono text-foreground">
                    ${trade.entryPrice < 1 ? trade.entryPrice.toFixed(8) : trade.entryPrice.toFixed(2)}
                  </td>
                )}
                {!simple && (
                  <td className="py-2.5 text-right font-mono text-foreground">
                    ${trade.exitPrice < 1 ? trade.exitPrice.toFixed(8) : trade.exitPrice.toFixed(2)}
                  </td>
                )}
                <td className="py-2.5 text-right font-mono text-muted-foreground">
                  {formatCurrency(trade.notionalValue, true)}
                </td>
                {!simple && (
                  <td className="py-2.5 text-right font-mono text-muted-foreground">
                    {formatCurrency(trade.fees.total)}
                  </td>
                )}
                <td className="py-2.5 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-mono font-semibold ${trade.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatCurrency(trade.pnl)}
                    </span>
                    <span className={`text-[10px] ${trade.pnl >= 0 ? 'text-profit/70' : 'text-loss/70'}`}>
                      {formatPercent(trade.pnlPercent)}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 pl-3">
                  {editingId === trade.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-6 w-[180px] bg-secondary text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(trade.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => saveEdit(trade.id)}>
                        <Check className="h-3 w-3 text-profit" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3 text-loss" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="max-w-[200px] truncate text-muted-foreground">
                        {trade.notes || '-'}
                      </span>
                      <button
                        onClick={() => startEdit(trade.id, trade.notes)}
                        className="opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
                        style={{ opacity: undefined }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="py-2.5 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditingTrade(trade)}
                    title="Edit trade"
                  >
                    <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <EditTradeModal
          trade={editingTrade}
          open={editingTrade !== null}
          onClose={() => setEditingTrade(null)}
        />
      </CardContent>
    </Card>
  )
}
