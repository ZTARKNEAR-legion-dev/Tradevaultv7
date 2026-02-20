'use client'

import { useState } from 'react'
import { Download, Upload, Lock, AlertCircle, CheckCircle2, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createEncryptedBackup, decryptBackup } from '@/lib/crypto'
import { useData } from '@/components/providers/data-provider'
import type { Trade } from '@/lib/types'

export function SecureBackup() {
  const { trades, addManualTrade } = useData()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleExport = async () => {
    if (!password) {
      setStatus({ type: 'error', message: 'Please enter a password' })
      return
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' })
      return
    }

    if (password.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters' })
      return
    }

    try {
      setIsExporting(true)
      setStatus(null)

      const manualTrades = trades.filter(t => t.source === 'manual')
      
      const backupData = {
        version: 1,
        exportDate: new Date().toISOString(),
        trades: manualTrades,
        tradeCount: manualTrades.length
      }

      const encrypted = await createEncryptedBackup(backupData, password)

      // Download as file
      const blob = new Blob([encrypted], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tradervault-backup-${new Date().toISOString().split('T')[0]}.tvbackup`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus({ 
        type: 'success', 
        message: `Successfully exported ${manualTrades.length} trades. Keep your password safe!` 
      })
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Export failed:', error)
      setStatus({ type: 'error', message: 'Export failed. Please try again.' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!importPassword) {
      setStatus({ type: 'error', message: 'Please enter the backup password' })
      return
    }

    try {
      setIsImporting(true)
      setStatus(null)

      const text = await file.text()
      const decrypted = await decryptBackup(text, importPassword) as {
        version: number
        exportDate: string
        trades: Trade[]
        tradeCount: number
      }

      if (!decrypted.trades || !Array.isArray(decrypted.trades)) {
        throw new Error('Invalid backup format')
      }

      // Import trades
      let imported = 0
      for (const trade of decrypted.trades) {
        const fixedTrade = {
          ...trade,
          entryTime: new Date(trade.entryTime),
          exitTime: new Date(trade.exitTime),
          id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        }
        addManualTrade(fixedTrade)
        imported++
      }

      setStatus({ 
        type: 'success', 
        message: `Successfully imported ${imported} trades from backup` 
      })
      setImportPassword('')
      
      // Reset file input
      event.target.value = ''
    } catch (error) {
      console.error('Import failed:', error)
      setStatus({ 
        type: 'error', 
        message: 'Import failed. Check your password and file.' 
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">Secure Backup & Restore</h3>
      </div>
      
      <p className="mb-6 text-xs text-muted-foreground">
        Export your manual trades with password encryption. Your data stays private and secure.
      </p>

      {status && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-xs ${
          status.type === 'success' 
            ? 'bg-profit/10 text-profit' 
            : 'bg-loss/10 text-loss'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {status.message}
        </div>
      )}

      <div className="space-y-6">
        {/* Export Section */}
        <div className="rounded-lg border border-border/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Export Trades</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Create Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting || !password || !confirmPassword}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Encrypted Backup'}
            </Button>
          </div>
        </div>

        {/* Import Section */}
        <div className="rounded-lg border border-border/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Import Trades</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Backup Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  placeholder="Enter backup password"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block">
                <span className="sr-only">Choose backup file</span>
                <input
                  type="file"
                  accept=".tvbackup"
                  onChange={handleImport}
                  disabled={isImporting || !importPassword}
                  className="block w-full text-xs text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            <strong>Security Note:</strong> Backups are encrypted with AES-256-GCM using 250,000 PBKDF2 iterations. 
            Your password is never stored. If you forget it, the backup cannot be recovered.
          </p>
        </div>
      </div>
    </div>
  )
}
