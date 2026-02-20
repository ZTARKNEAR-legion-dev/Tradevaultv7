'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useData } from '@/components/providers/data-provider'
import type { Trade } from '@/lib/types'
import { format } from 'date-fns'

interface Props {
  trade: Trade | null
  open: boolean
  onClose: () => void
}

export function EditTradeModal({ trade, open, onClose }: Props) {
  const { editTrade } = useData()
  const [formData, setFormData] = useState({
    symbol: '',
    side: 'long' as 'long' | 'short',
    entryPrice: '',
    exitPrice: '',
    size: '',
    notionalValue: '',
    entryTime: '',
    exitTime: '',
    orderType: 'market' as 'market' | 'limit' | 'stop',
    leverage: '',
    fees: '',
    notes: '',
  })

  useEffect(() => {
    if (trade) {
      setFormData({
        symbol: trade.symbol,
        side: trade.side,
        entryPrice: trade.entryPrice.toString(),
        exitPrice: trade.exitPrice.toString(),
        size: trade.size.toString(),
        notionalValue: trade.notionalValue.toString(),
        entryTime: format(trade.entryTime, "yyyy-MM-dd'T'HH:mm"),
        exitTime: format(trade.exitTime, "yyyy-MM-dd'T'HH:mm"),
        orderType: trade.orderType,
        leverage: trade.leverage.toString(),
        fees: trade.fees.total.toString(),
        notes: trade.notes,
      })
    }
  }, [trade])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!trade) return

    const entryPrice = parseFloat(formData.entryPrice)
    const exitPrice = parseFloat(formData.exitPrice)
    const size = parseFloat(formData.size)
    const notionalValue = parseFloat(formData.notionalValue)
    const leverage = parseInt(formData.leverage)
    const totalFees = parseFloat(formData.fees)

    editTrade(trade.id, {
      symbol: formData.symbol,
      side: formData.side,
      entryPrice,
      exitPrice,
      size,
      notionalValue,
      entryTime: new Date(formData.entryTime),
      exitTime: new Date(formData.exitTime),
      orderType: formData.orderType,
      leverage,
      fees: {
        trading: totalFees * 0.7,
        funding: totalFees * 0.3,
        total: totalFees,
      },
      notes: formData.notes,
    })

    onClose()
  }

  if (!trade) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="BTC-PERP"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="side">Side</Label>
              <Select value={formData.side} onValueChange={(value: 'long' | 'short') => setFormData({ ...formData, side: value })}>
                <SelectTrigger id="side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price ($)</Label>
              <Input
                id="entryPrice"
                type="number"
                step="0.00000001"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price ($)</Label>
              <Input
                id="exitPrice"
                type="number"
                step="0.00000001"
                value={formData.exitPrice}
                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                type="number"
                step="0.00000001"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notionalValue">Notional Value ($)</Label>
              <Input
                id="notionalValue"
                type="number"
                step="0.01"
                value={formData.notionalValue}
                onChange={(e) => setFormData({ ...formData, notionalValue: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryTime">Entry Time</Label>
              <Input
                id="entryTime"
                type="datetime-local"
                value={formData.entryTime}
                onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitTime">Exit Time</Label>
              <Input
                id="exitTime"
                type="datetime-local"
                value={formData.exitTime}
                onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderType">Order Type</Label>
              <Select value={formData.orderType} onValueChange={(value: 'market' | 'limit' | 'stop') => setFormData({ ...formData, orderType: value })}>
                <SelectTrigger id="orderType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop">Stop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leverage">Leverage</Label>
              <Input
                id="leverage"
                type="number"
                min="1"
                max="125"
                value={formData.leverage}
                onChange={(e) => setFormData({ ...formData, leverage: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fees">Total Fees ($)</Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add trade notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
