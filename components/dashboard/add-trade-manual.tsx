'use client'

import { useState } from 'react'
import { X, Plus, TrendingUp, TrendingDown, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sanitizeSymbol, sanitizeNumber, sanitizeText } from '@/lib/sanitize'
import type { Trade } from '@/lib/types'

// Parse numbers like "100k" or "1.5M" into actual numbers
function parseNumberWithSuffix(value: string): number {
  if (!value) return 0
  const cleaned = value.toLowerCase().trim()
  const match = cleaned.match(/^([\d.]+)\s*([km])?$/)
  if (!match) return 0
  
  const num = parseFloat(match[1])
  if (isNaN(num)) return 0
  
  const suffix = match[2]
  if (suffix === 'k') return num * 1000
  if (suffix === 'm') return num * 1000000
  return num
}

interface ManualTradeFormProps {
  onAdd: (trade: Trade) => void
  onClose: () => void
}

export function AddTradeManual({ onAdd, onClose }: ManualTradeFormProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    side: 'long' as 'long' | 'short',
    exchange: '',
    entryDate: new Date().toISOString().split('T')[0],
    entryTime: '',
    exitDate: new Date().toISOString().split('T')[0],
    exitTime: '',
    entryPrice: '',
    exitPrice: '',
    size: '',
    leverage: '',
    orderType: 'market' as 'market' | 'limit' | 'stop',
    tradingFee: '',
    fundingFee: '',
    reasonForBuy: '',
    reasonForExit: '',
    trace: '',
    notes: '',
    screenshot: null as File | null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol required'
    }
    
    const entryPrice = parseNumberWithSuffix(formData.entryPrice)
    if (entryPrice <= 0) {
      newErrors.entryPrice = 'Valid entry price required'
    }
    
    const exitPrice = parseNumberWithSuffix(formData.exitPrice)
    if (exitPrice <= 0) {
      newErrors.exitPrice = 'Valid exit price required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const entryPrice = parseNumberWithSuffix(formData.entryPrice)
      const exitPrice = parseNumberWithSuffix(formData.exitPrice)
      const size = parseNumberWithSuffix(formData.size) || 1 // Default to 1 if not provided
      const tradingFee = parseNumberWithSuffix(formData.tradingFee) || 0
      const fundingFee = parseNumberWithSuffix(formData.fundingFee) || 0

      // Get leverage
      const leverage = formData.leverage ? parseNumberWithSuffix(formData.leverage.replace('x', '')) : 1
      
      // Calculate PnL (with leverage applied)
      const priceChange = formData.side === 'long' 
        ? (exitPrice - entryPrice) 
        : (entryPrice - exitPrice)
      const basePnl = (priceChange * size) - tradingFee - fundingFee
      const pnl = basePnl * leverage
      const notionalValue = entryPrice * size * leverage

      // Smart date/time handling with defaults
      const now = new Date()
      const todayISO = now.toISOString().split('T')[0]
      
      // Use provided dates or default to today
      const entryDateStr = formData.entryDate || todayISO
      const exitDateStr = formData.exitDate || todayISO
      const entryTimeStr = formData.entryTime || '09:00'
      const exitTimeStr = formData.exitTime || '17:00'
      
      // Create valid timestamps
      const entryTimestamp = new Date(`${entryDateStr}T${entryTimeStr}:00Z`)
      const exitTimestamp = new Date(`${exitDateStr}T${exitTimeStr}:00Z`)
      
      // Fallback to current time if still invalid
      if (isNaN(entryTimestamp.getTime())) {
        entryTimestamp.setTime(now.getTime())
      }
      if (isNaN(exitTimestamp.getTime())) {
        exitTimestamp.setTime(now.getTime())
      }

      // Calculate PnL percent
      const pnlPercent = notionalValue > 0 ? (pnl / notionalValue) * 100 : 0

      // Sanitize all inputs before creating trade
      const sanitizedSymbol = sanitizeSymbol(formData.symbol)
      const sanitizedExchange = sanitizeText(formData.exchange)
      const sanitizedNotes = sanitizeText(formData.notes)
      const sanitizedReasonForBuy = sanitizeText(formData.reasonForBuy)
      const sanitizedReasonForExit = sanitizeText(formData.reasonForExit)
      const sanitizedTrace = sanitizeText(formData.trace)

      const trade: Trade = {
        id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        symbol: sanitizedSymbol.toUpperCase().includes('-PERP') 
          ? sanitizedSymbol.toUpperCase() 
          : `${sanitizedSymbol.toUpperCase()}-PERP`,
        side: formData.side,
        entryPrice,
        exitPrice,
        size,
        pnl,
        pnlPercent,
        fees: {
          trading: tradingFee,
          funding: fundingFee,
          total: tradingFee + fundingFee,
        },
        entryTime: entryTimestamp,
        exitTime: exitTimestamp,
        orderType: formData.orderType,
        notionalValue,
        leverage,
        source: 'manual' as const,
        exchange: sanitizedExchange || undefined,
        notes: [
          `Exchange: ${sanitizedExchange || 'Not specified'}`,
          formData.leverage && `Leverage: ${sanitizeNumber(formData.leverage)}`,
          sanitizedReasonForBuy && `Buy reason: ${sanitizedReasonForBuy}`,
          sanitizedReasonForExit && `Exit reason: ${sanitizedReasonForExit}`,
          sanitizedTrace && `Trace: ${sanitizedTrace}`,
          formData.entryTime && formData.exitTime && (() => {
            const [eH, eM] = formData.entryTime.split(':').map(Number)
            const [exH, exM] = formData.exitTime.split(':').map(Number)
            let hours = exH - eH
            let mins = exM - eM
            if (mins < 0) {
              hours--
              mins += 60
            }
            if (hours < 0) hours += 24
            return `Holding: ${hours}h ${mins}m`
          })(),
          formData.screenshot && `Screenshot: ${formData.screenshot.name}`,
          formData.notes && `Notes: ${formData.notes}`,
        ]
          .filter(Boolean)
          .join(' | ') || 'Manual trade',
        liquidated: false,
      }

      onAdd(trade)
      
      // Reset form and close
      setFormData({ 
        symbol: '', 
        side: 'long', 
        exchange: '',
        entryDate: new Date().toISOString().split('T')[0],
        entryTime: '',
        exitDate: new Date().toISOString().split('T')[0],
        exitTime: '',
        entryPrice: '', 
        exitPrice: '', 
        size: '',
        leverage: '',
        orderType: 'market', 
        tradingFee: '', 
        fundingFee: '',
        reasonForBuy: '',
        reasonForExit: '',
        trace: '',
        notes: '',
        screenshot: null,
      })
      setErrors({})
      setIsSubmitting(false)
      
      // Close after a brief delay
      setTimeout(() => {
        onClose()
      }, 300)
      
      return
    } catch (err) {
      console.error('Error adding manual trade:', err)
      setErrors({ form: 'Failed to add trade. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNumberChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Smart date handler - accepts just day numbers like "20" or "28"
  const handleDateChange = (field: 'entryDate' | 'exitDate', value: string) => {
    // If value is just 1-2 digits, treat it as day of current month
    const dayOnlyMatch = value.match(/^(\d{1,2})$/)
    if (dayOnlyMatch) {
      const day = parseInt(dayOnlyMatch[1])
      if (day >= 1 && day <= 31) {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const dayStr = String(day).padStart(2, '0')
        const fullDate = `${year}-${month}-${dayStr}`
        setFormData(prev => ({ ...prev, [field]: fullDate }))
        return
      }
    }
    // Otherwise use the value as-is (full date format)
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 border-b border-border bg-card/95 backdrop-blur px-7 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Add Manual Trade</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Use k for thousands (100k), M for millions (1.5M)</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 px-7 py-5">
          {/* Row 1: Symbol, Position, Exchange, Order Type, Leverage */}
          <div className="grid gap-3 grid-cols-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">
                Symbol <span className="text-loss">*</span>
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="BTC"
                className={`w-full rounded-lg border ${errors.symbol ? 'border-loss' : 'border-border'} bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.symbol && <p className="mt-1 text-xs text-loss font-medium">{errors.symbol}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Position</label>
              <div className="flex gap-2">
                {['long', 'short'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, side: s as 'long' | 'short' })}
                    className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                      formData.side === s
                        ? s === 'long'
                          ? 'border-profit bg-profit/10 text-profit'
                          : 'border-loss bg-loss/10 text-loss'
                        : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s === 'long' ? 'Long' : 'Short'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Exchange</label>
              <input
                type="text"
                value={formData.exchange}
                onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                placeholder="Binance, Bybit..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Order Type</label>
              <select
                value={formData.orderType}
                onChange={(e) => setFormData({ ...formData, orderType: e.target.value as any })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
                <option value="stop">Stop</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Leverage</label>
              <input
                type="text"
                value={formData.leverage}
                onChange={(e) => handleNumberChange('leverage', e.target.value)}
                placeholder="1x, 10x..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Row 2: Entry Price, Exit Price, Size, $ Total Size */}
          <div className="grid gap-3 grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">
                Entry Price <span className="text-loss">*</span>
              </label>
              <input
                type="text"
                value={formData.entryPrice}
                onChange={(e) => handleNumberChange('entryPrice', e.target.value)}
                placeholder="100k"
                className={`w-full rounded-lg border ${errors.entryPrice ? 'border-loss' : 'border-border'} bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.entryPrice && <p className="mt-1 text-xs text-loss font-medium">{errors.entryPrice}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">
                Exit Price <span className="text-loss">*</span>
              </label>
              <input
                type="text"
                value={formData.exitPrice}
                onChange={(e) => handleNumberChange('exitPrice', e.target.value)}
                placeholder="105k"
                className={`w-full rounded-lg border ${errors.exitPrice ? 'border-loss' : 'border-border'} bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.exitPrice && <p className="mt-1 text-xs text-loss font-medium">{errors.exitPrice}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">
                Size <span className="text-loss">*</span>
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => handleNumberChange('size', e.target.value)}
                placeholder="10k"
                className={`w-full rounded-lg border ${errors.size ? 'border-loss' : 'border-border'} bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              {errors.size && <p className="mt-1 text-xs text-loss font-medium">{errors.size}</p>}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">$ Total</label>
              <div className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-mono text-muted-foreground flex items-center">
                {formData.entryPrice && formData.size
                  ? `$${(parseNumberWithSuffix(formData.entryPrice) * parseNumberWithSuffix(formData.size)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                  : '-'}
              </div>
            </div>
          </div>

          {/* Row 3: Entry Date, Exit Date, Trading Fee, Funding Fee */}
          <div className="grid gap-3 grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Entry Date</label>
              <input
                type="text"
                value={formData.entryDate}
                onChange={(e) => handleDateChange('entryDate', e.target.value)}
                onBlur={(e) => {
                  // On blur, ensure it's a valid date format or convert day number
                  if (e.target.value && !e.target.value.includes('-')) {
                    handleDateChange('entryDate', e.target.value)
                  }
                }}
                placeholder="20 or 2024-12-20"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Exit Date</label>
              <input
                type="text"
                value={formData.exitDate}
                onChange={(e) => handleDateChange('exitDate', e.target.value)}
                onBlur={(e) => {
                  // On blur, ensure it's a valid date format or convert day number
                  if (e.target.value && !e.target.value.includes('-')) {
                    handleDateChange('exitDate', e.target.value)
                  }
                }}
                placeholder="28 or 2024-12-28"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Trading Fee</label>
              <input
                type="text"
                value={formData.tradingFee}
                onChange={(e) => handleNumberChange('tradingFee', e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Funding Fee</label>
              <input
                type="text"
                value={formData.fundingFee}
                onChange={(e) => handleNumberChange('fundingFee', e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Row 4: Entry Time, Exit Time, Why Enter, Why Exit */}
          <div className="grid gap-3 grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Entry Time</label>
              <input
                type="time"
                value={formData.entryTime}
                onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Exit Time</label>
              <input
                type="time"
                value={formData.exitTime}
                onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Why Enter?</label>
              <input
                type="text"
                value={formData.reasonForBuy}
                onChange={(e) => setFormData({ ...formData, reasonForBuy: e.target.value })}
                placeholder="Support, MA..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Why Exit?</label>
              <input
                type="text"
                value={formData.reasonForExit}
                onChange={(e) => setFormData({ ...formData, reasonForExit: e.target.value })}
                placeholder="TP, SL..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Holding Duration Display */}
          {formData.entryTime && formData.exitTime && (
            <div className="rounded-lg bg-secondary/30 border border-primary/20 px-3 py-2.5">
              <p className="text-xs text-foreground">
                <span className="font-bold">Holding:</span>{' '}
                <span className="text-primary font-mono">
                  {(() => {
                    const [eH, eM] = formData.entryTime.split(':').map(Number)
                    const [exH, exM] = formData.exitTime.split(':').map(Number)
                    let hours = exH - eH
                    let mins = exM - eM
                    if (mins < 0) {
                      hours--
                      mins += 60
                    }
                    if (hours < 0) hours += 24
                    return `${hours}h ${mins}m`
                  })()}
                </span>
              </p>
            </div>
          )}

          {/* Row 5: Trace & Screenshot */}
          <div className="grid gap-3 grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Reference/Trace</label>
              <input
                type="text"
                value={formData.trace}
                onChange={(e) => setFormData({ ...formData, trace: e.target.value })}
                placeholder="TX ID, link..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-foreground">Screenshot</label>
              <label className="w-full rounded-lg border-2 border-dashed border-border bg-secondary/30 px-3 py-2 text-xs text-foreground cursor-pointer hover:border-primary transition-colors flex items-center justify-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                <span className="truncate">{formData.screenshot ? formData.screenshot.name : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setFormData({ ...formData, screenshot: file })
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="mb-2 block text-xs font-bold text-foreground">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-card px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'Adding Trade...' : 'Add Trade'}
            </button>
          </div>

          {errors.form && <p className="text-center text-xs text-loss font-medium">{errors.form}</p>}
        </form>
      </div>
    </div>
  )
}
