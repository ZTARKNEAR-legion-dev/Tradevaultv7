'use client'

import { useState, useRef, type DragEvent } from 'react'
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Loader2 } from 'lucide-react'
import { parseTradeFile, downloadSampleCSV, type ParseResult } from '@/lib/file-parser'
import type { Trade } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onParsed: (trades: Trade[]) => void
  onTryDemo?: () => void
}

export function UploadModal({ open, onClose, onParsed, onTryDemo }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  async function handleFile(file: File) {
    setFileName(file.name)
    setLoading(true)
    setResult(null)
    const res = await parseTradeFile(file)
    setResult(res)
    setLoading(false)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleUse() {
    if (result && result.trades.length > 0) {
      onParsed(result.trades)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-3xl rounded-2xl border border-border bg-card p-7 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Upload Trade Data</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">CSV or Excel file with your trades</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop zone */}
        {!result && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-secondary/30'
            }`}
            onClick={() => inputRef.current?.click()}
          >
            {loading ? (
              <>
                <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                <p className="text-base font-semibold text-foreground">Parsing {fileName}...</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="mb-4 h-10 w-10 text-muted-foreground/40" />
                <p className="text-base font-semibold text-foreground">Drop your file here or click to browse</p>
                <p className="mt-2 text-sm text-muted-foreground">Supports .csv, .xlsx, .xls</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={onFileSelect}
            />
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="flex flex-col gap-4">
            {/* Success info */}
            <div className={`flex items-start gap-4 rounded-xl p-4 ${
              result.trades.length > 0 ? 'bg-profit/5 ring-1 ring-profit/10' : 'bg-loss/5 ring-1 ring-loss/10'
            }`}>
              {result.trades.length > 0 ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-profit" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-loss" />
              )}
              <div className="w-full">
                <p className="text-sm font-bold text-foreground">
                  {result.trades.length > 0
                    ? `${result.parsedRows} trades parsed from ${result.totalRows} rows`
                    : 'Could not parse trades'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{fileName}</p>
                {result.errors.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto space-y-1 rounded-lg bg-background/50 p-2.5">
                    {result.errors.slice(0, 6).map((err, i) => (
                      <p key={i} className="text-xs text-loss/80 leading-relaxed">{err}</p>
                    ))}
                    {result.errors.length > 6 && (
                      <p className="text-xs text-muted-foreground">+{result.errors.length - 6} more messages</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Detected columns mapping */}
            {result.detectedColumns && result.detectedColumns.length > 0 && (
              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Detected Columns</p>
                <div className="grid grid-cols-3 gap-2">
                  {result.detectedColumns.map((col, i) => (
                    <div key={i} className="rounded-lg bg-card px-3 py-2 text-xs">
                      <p className="font-mono text-muted-foreground">{col}</p>
                    </div>
                  ))}
                </div>
                {result.mapping && Object.keys(result.mapping).length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="mb-2.5 text-xs font-semibold text-foreground">Mapped As:</p>
                    <div className="space-y-1.5 text-xs">
                      {Object.entries(result.mapping).map(([field, column]) => (
                        <div key={field} className="flex items-center justify-between">
                          <span className="font-mono text-muted-foreground">{field}:</span>
                          <span className="font-medium text-foreground">{column}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preview - show first 3 trades */}
            {result.trades.length > 0 && (
              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Preview</p>
                <div className="flex flex-col gap-2">
                  {result.trades.slice(0, 3).map((t, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className={`rounded px-2 py-1 text-xs font-bold ${t.side === 'long' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                          {t.side.toUpperCase()}
                        </span>
                        <span className="font-semibold text-foreground">{t.symbol}</span>
                      </div>
                      <span className={`font-mono font-bold ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {result.trades.length > 3 && (
                    <p className="text-center text-xs text-muted-foreground">+{result.trades.length - 3} more trades</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleUse}
                disabled={result.trades.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-profit px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" />
                Use Trades ({result.trades.length} detected)
              </button>
              <button
                onClick={() => { onClose(); onTryDemo?.() }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
              >
                Try Demo Mode
              </button>
            </div>
          </div>
        )}

        {/* Sample download */}
        <div className="mt-5 flex items-center justify-center gap-2 border-t border-border pt-4">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Download sample CSV template
          </button>
        </div>

        {/* Column guide */}
        <details className="mt-3">
          <summary className="cursor-pointer text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            How to name your columns
          </summary>
          <div className="mt-3 space-y-2.5 rounded-lg bg-secondary/50 p-4 text-xs leading-relaxed text-muted-foreground font-mono">
            <div>
              <p className="font-bold text-foreground mb-1.5">REQUIRED (at least one):</p>
              <p><span className="text-primary">entry_price, price, open_price</span> - Amount you entered at</p>
              <p className="mt-0.5"><span className="text-primary">OR pnl, profit, gain_loss</span> - Your profit/loss</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-1.5">IMPORTANT:</p>
              <p><span className="text-primary">symbol, pair, ticker, asset</span> - BTC, ETH, SOL, etc</p>
              <p className="mt-0.5"><span className="text-primary">side, direction, type</span> - long or short</p>
              <p className="mt-0.5"><span className="text-primary">exit_price, close_price</span> - Exit amount</p>
              <p className="mt-0.5"><span className="text-primary">size, qty, quantity, volume</span> - How much you traded</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-1.5">TIME COLUMNS:</p>
              <p><span className="text-primary">entry_time, entry_date, date</span> - When you entered</p>
              <p className="mt-0.5"><span className="text-primary">exit_time, exit_date, close_time</span> - When you exited</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-1.5">OPTIONAL:</p>
              <p><span className="text-primary">fees, commission, trading_fee</span> | <span className="text-primary">leverage, multiplier</span> | <span className="text-primary">order_type</span> | <span className="text-primary">notes, strategy</span></p>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
