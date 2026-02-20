'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, Check, AlertCircle, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CSVColumn {
  name: string
  type: 'text' | 'number' | 'date' | 'unknown'
  sampleValues: string[]
  detectedAs?: string
}

interface CSVUploadModalProps {
  open: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

export function CSVUploadModal({ open, onClose, onUploadSuccess }: CSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<CSVColumn[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [stage, setStage] = useState<'upload' | 'preview' | 'coming-soon'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const detectColumnType = (values: string[]): 'text' | 'number' | 'date' | 'unknown' => {
    const nonEmptyValues = values.filter(v => v && v.trim())
    if (nonEmptyValues.length === 0) return 'unknown'

    // Check if all are numbers
    const allNumbers = nonEmptyValues.every(v => !isNaN(Number(v)))
    if (allNumbers) return 'number'

    // Check if looks like dates
    const datePatterns = [
      /\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /\d{2}-\d{2}-\d{4}/, // DD-MM-YYYY
    ]
    const looksLikeDate = nonEmptyValues.some(v => 
      datePatterns.some(pattern => pattern.test(v))
    )
    if (looksLikeDate) return 'date'

    return 'text'
  }

  const detectTradeField = (columnName: string, type: string): string | undefined => {
    const name = columnName.toLowerCase()
    
    if (name.includes('symbol') || name.includes('pair') || name.includes('market')) return 'Symbol'
    if (name.includes('side') || name.includes('direction') || name.includes('long') || name.includes('short')) return 'Side'
    if (name.includes('entry') && (name.includes('price') || name.includes('rate'))) return 'Entry Price'
    if (name.includes('exit') && (name.includes('price') || name.includes('rate'))) return 'Exit Price'
    if (name.includes('size') || name.includes('quantity') || name.includes('amount')) return 'Size'
    if (name.includes('pnl') || name.includes('profit') || name.includes('loss')) return 'PnL'
    if (name.includes('fee')) return 'Fees'
    if (name.includes('entry') && type === 'date') return 'Entry Time'
    if (name.includes('exit') && type === 'date') return 'Exit Time'
    if (name.includes('exchange') || name.includes('platform')) return 'Exchange'
    
    return undefined
  }

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim())
    return lines.map(line => {
      // Simple CSV parser - handles quoted fields
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    })
  }

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    setFile(selectedFile)
    
    const text = await selectedFile.text()
    const rows = parseCSV(text)
    
    if (rows.length < 2) {
      alert('CSV file must have at least a header row and one data row')
      return
    }

    const headers = rows[0]
    const dataRows = rows.slice(1)
    setRowCount(dataRows.length)

    // Analyze each column
    const analyzedColumns: CSVColumn[] = headers.map((header, index) => {
      const columnValues = dataRows.slice(0, 5).map(row => row[index] || '')
      const type = detectColumnType(columnValues)
      const detectedAs = detectTradeField(header, type)
      
      return {
        name: header,
        type,
        sampleValues: columnValues,
        detectedAs,
      }
    })

    setColumns(analyzedColumns)
    setStage('preview')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleProceed = () => {
    setStage('coming-soon')
  }

  const handleClose = () => {
    setFile(null)
    setColumns([])
    setRowCount(0)
    setStage('upload')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Import CSV Data</h2>
              <p className="text-xs text-muted-foreground">
                {stage === 'upload' && 'Upload your trading history CSV file'}
                {stage === 'preview' && 'Review detected columns and data'}
                {stage === 'coming-soon' && 'Exchange integration coming soon'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {stage === 'upload' && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {isDragging ? 'Drop your CSV file here' : 'Upload CSV File'}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Drag and drop your file here, or click to browse
                </p>
                <Button className="mx-auto">
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>

              <div className="mt-6 rounded-lg border border-border bg-accent/30 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Expected CSV Format
                </h4>
                <p className="mb-3 text-xs text-muted-foreground">
                  Your CSV should contain columns for: Symbol, Side, Entry Price, Exit Price, Size, Entry Time, Exit Time
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-2 py-1 text-left font-medium text-muted-foreground">Symbol</th>
                        <th className="px-2 py-1 text-left font-medium text-muted-foreground">Side</th>
                        <th className="px-2 py-1 text-left font-medium text-muted-foreground">Entry</th>
                        <th className="px-2 py-1 text-left font-medium text-muted-foreground">Exit</th>
                        <th className="px-2 py-1 text-left font-medium text-muted-foreground">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-muted-foreground">
                        <td className="px-2 py-1">BTC-PERP</td>
                        <td className="px-2 py-1">long</td>
                        <td className="px-2 py-1">45000</td>
                        <td className="px-2 py-1">46000</td>
                        <td className="px-2 py-1">0.5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {stage === 'preview' && (
            <div>
              <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-accent/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <Check className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{file?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rowCount} trades detected, {columns.length} columns
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="mb-4 text-sm font-semibold text-foreground">Detected Columns</h3>
              <div className="space-y-2">
                {columns.map((col, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{col.name}</p>
                        <span className="rounded bg-accent px-2 py-0.5 text-xs text-muted-foreground">
                          {col.type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sample: {col.sampleValues.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    {col.detectedAs && (
                      <div className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1">
                        <Check className="h-3 w-3 text-success" />
                        <span className="text-xs font-medium text-success">{col.detectedAs}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStage('upload')} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleProceed} className="flex-1">
                  <Database className="mr-2 h-4 w-4" />
                  Proceed to Import
                </Button>
              </div>
            </div>
          )}

          {stage === 'coming-soon' && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">Coming Soon!</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                CSV import and exchange integration features are currently under development.
                We're working hard to bring you seamless trade data importing soon.
              </p>
              <div className="rounded-lg border border-border bg-accent/30 p-4">
                <p className="text-xs font-medium text-foreground">Detected your file structure:</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {columns.filter(c => c.detectedAs).length} of {columns.length} columns matched
                </p>
              </div>
              <Button onClick={handleClose} className="mt-6">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
