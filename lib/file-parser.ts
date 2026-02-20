import * as XLSX from 'xlsx'
import type { Trade } from '@/lib/types'

/**
 * Parses CSV or Excel files into Trade objects.
 * Accepts flexible column names and auto-maps to our schema.
 */

const COLUMN_ALIASES: Record<keyof MappableFields, string[]> = {
  symbol:     ['symbol', 'pair', 'market', 'instrument', 'ticker', 'asset'],
  side:       ['side', 'direction', 'type', 'position', 'long/short'],
  entryPrice: ['entry_price', 'entryprice', 'entry', 'open_price', 'openprice', 'buy_price'],
  exitPrice:  ['exit_price', 'exitprice', 'exit', 'close_price', 'closeprice', 'sell_price'],
  size:       ['size', 'qty', 'quantity', 'amount', 'volume', 'contracts', 'lots'],
  entryTime:  ['entry_time', 'entrytime', 'entry_date', 'entrydate', 'open_time', 'open_date', 'date_opened'],
  exitTime:   ['exit_time', 'exittime', 'exit_date', 'exitdate', 'close_time', 'close_date', 'date_closed', 'date'],
  orderType:  ['order_type', 'ordertype', 'order', 'exec_type'],
  pnl:        ['pnl', 'profit', 'profit_loss', 'pl', 'realized_pnl', 'realizedpnl', 'net_pnl', 'gain_loss'],
  fees:       ['fees', 'fee', 'commission', 'total_fee', 'trading_fee'],
  leverage:   ['leverage', 'lev', 'multiplier'],
  notes:      ['notes', 'note', 'comment', 'comments', 'memo', 'tag'],
  strategy:   ['strategy', 'strat', 'setup', 'pattern', 'trade_type', 'tradetype', 'method'],
}

interface MappableFields {
  symbol: string
  side: string
  entryPrice: string
  exitPrice: string
  size: string
  entryTime: string
  exitTime: string
  orderType: string
  pnl: string
  fees: string
  leverage: string
  notes: string
  strategy: string
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s\-_()]/g, '')
}

function matchColumn(header: string, aliases: string[]): boolean {
  const h = normalizeHeader(header)
  return aliases.some((a) => h === normalizeHeader(a))
}

/**
 * Smart fuzzy matching for column names.
 * Accepts partial matches and keyword-based detection.
 */
function fuzzyMatchColumn(header: string, field: keyof MappableFields): number {
  const h = normalizeHeader(header)
  const keywords = {
    symbol:     ['symbol', 'pair', 'asset', 'ticker', 'coin', 'crypto'],
    side:       ['side', 'direction', 'type', 'position', 'long', 'short', 'buy', 'sell'],
    entryPrice: ['entry', 'open', 'in', 'buy', 'entry_price', 'openprice', 'entry_', 'open_', 'entryprice'],
    exitPrice:  ['exit', 'close', 'out', 'sell', 'exit_price', 'closeprice', 'exit_', 'close_', 'exitprice'],
    size:       ['size', 'qty', 'quantity', 'amount', 'volume', 'contracts', 'lots', 'qty'],
    entryTime:  ['entrydate', 'entrydate', 'entry_date', 'opendate', 'open_date', 'opentime', 'entry_time'],
    exitTime:   ['exitdate', 'exit_date', 'closedate', 'close_date', 'closetime', 'exit_time'],
    orderType:  ['ordertype', 'order_type', 'order'],
    pnl:        ['pnl', 'profit', 'pl', 'gain', 'gainloss', 'realizedpnl', 'return', 'closedpnl'],
    fees:       ['fee', 'fees', 'commission', 'tradingfee'],
    leverage:   ['leverage', 'lev', 'multiplier', 'margin'],
    notes:      ['notes', 'note', 'comment', 'memo', 'tag'],
    strategy:   ['strategy', 'strat', 'setup', 'pattern', 'type'],
  }

  const fieldKeywords = keywords[field] || []
  let score = 0

  // Exact match or starts with
  for (const kw of fieldKeywords) {
    if (h === normalizeHeader(kw)) return 100
    if (h.startsWith(normalizeHeader(kw))) score = Math.max(score, 90)
    if (normalizeHeader(kw).startsWith(h)) score = Math.max(score, 85)
  }

  // Contains keyword
  for (const kw of fieldKeywords) {
    const kwNorm = normalizeHeader(kw)
    if (h.includes(kwNorm)) score = Math.max(score, 75)
    if (kwNorm.includes(h)) score = Math.max(score, 60)
  }

  return score
}

function mapHeaders(headers: string[]): Partial<Record<keyof MappableFields, number>> {
  const mapping: Partial<Record<keyof MappableFields, number>> = {}
  const assignedColumns = new Set<number>()

  // First pass: exact matches
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = headers.findIndex((h, i) => !assignedColumns.has(i) && matchColumn(h, aliases))
    if (idx !== -1) {
      mapping[field as keyof MappableFields] = idx
      assignedColumns.add(idx)
    }
  }

  // Second pass: fuzzy matching for remaining columns
  for (const field of Object.keys(COLUMN_ALIASES) as Array<keyof MappableFields>) {
    if (mapping[field] !== undefined) continue

    let bestIdx = -1
    let bestScore = 0

    for (let i = 0; i < headers.length; i++) {
      if (assignedColumns.has(i)) continue
      const score = fuzzyMatchColumn(headers[i], field)
      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }

    if (bestScore > 40) {
      mapping[field] = bestIdx
      assignedColumns.add(bestIdx)
    }
  }

  return mapping
}

function parseNumber(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const cleaned = val.replace(/[$,\s%]/g, '').replace(/[()]/g, (m) => (m === '(' ? '-' : ''))
    const n = parseFloat(cleaned)
    return isNaN(n) ? 0 : n
  }
  return 0
}

function parseDate(val: unknown): Date {
  if (val instanceof Date) return val
  if (typeof val === 'number') {
    // Excel serial date
    const d = new Date((val - 25569) * 86400 * 1000)
    return isNaN(d.getTime()) ? new Date() : d
  }
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? new Date() : d
  }
  return new Date()
}

function parseSide(val: unknown): 'long' | 'short' {
  const s = String(val).toLowerCase().trim()
  if (s.includes('short') || s.includes('sell') || s === 's') return 'short'
  return 'long'
}

function parseOrderType(val: unknown): 'market' | 'limit' | 'stop' {
  const s = String(val).toLowerCase().trim()
  if (s.includes('limit')) return 'limit'
  if (s.includes('stop')) return 'stop'
  return 'market'
}

function rowToTrade(row: unknown[], mapping: Partial<Record<keyof MappableFields, number>>, index: number): Trade {
  const get = (field: keyof MappableFields): unknown => {
    const idx = mapping[field]
    return idx !== undefined ? row[idx] : undefined
  }

  const entryPrice = parseNumber(get('entryPrice'))
  const exitPrice = parseNumber(get('exitPrice'))
  const size = parseNumber(get('size')) || 1
  const side = parseSide(get('side'))
  const pnlRaw = get('pnl')
  const feesVal = parseNumber(get('fees'))
  const entryTime = parseDate(get('entryTime'))
  const exitTime = parseDate(get('exitTime') ?? get('entryTime'))
  const leverage = parseNumber(get('leverage')) || 1

  // If PnL is provided, use it. Otherwise calculate from prices.
  let pnl: number
  if (pnlRaw !== undefined && pnlRaw !== '' && pnlRaw !== null) {
    pnl = parseNumber(pnlRaw)
  } else {
    const diff = side === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice
    const basePnl = diff * size - feesVal
    pnl = basePnl * leverage
  }

  const notionalValue = entryPrice * size * leverage

  return {
    id: `upload-${index}-${Date.now()}`,
    symbol: String(get('symbol') ?? 'UNKNOWN').toUpperCase().replace(/\s/g, ''),
    side,
    entryPrice,
    exitPrice,
    size,
    notionalValue,
    entryTime,
    exitTime,
    orderType: parseOrderType(get('orderType')),
    fees: { trading: feesVal, funding: 0, total: feesVal },
    pnl,
    pnlPercent: notionalValue > 0 ? (pnl / notionalValue) * 100 : 0,
    strategy: String(get('strategy') ?? '').trim() || undefined,
    notes: String(get('notes') ?? ''),
    leverage,
    liquidated: false,
    source: 'mock', // uploaded data treated as mock source
  }
}

export interface ParseResult {
  trades: Trade[]
  errors: string[]
  totalRows: number
  parsedRows: number
  detectedColumns?: string[]
  mapping?: Record<string, string>
}

export async function parseTradeFile(file: File): Promise<ParseResult> {
  const errors: string[] = []

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    if (rawData.length < 2) {
      return { trades: [], errors: ['File is empty or has no data rows.'], totalRows: 0, parsedRows: 0, detectedColumns: [] }
    }

    const headers = (rawData[0] as string[]).map((h) => String(h))
    const mapping = mapHeaders(headers)

    // Build mapping display
    const mappingDisplay: Record<string, string> = {}
    for (const [field, idx] of Object.entries(mapping)) {
      if (idx !== undefined) {
        mappingDisplay[field] = headers[idx as number]
      }
    }

    // Validate we have minimum required columns
    const hasPrice = mapping.entryPrice !== undefined || mapping.pnl !== undefined
    if (!hasPrice) {
      return {
        trades: [],
        errors: [
          '❌ Could not find price or PnL columns.',
          `📊 We found these columns: ${headers.join(', ')}`,
          '✅ We need at least one of: entry_price, price, open_price, or pnl',
          '💡 See the column guide below to rename your columns properly.'
        ],
        totalRows: rawData.length - 1,
        parsedRows: 0,
        detectedColumns: headers,
        mapping: mappingDisplay,
      }
    }

    const trades: Trade[] = []
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as unknown[]
      if (!row || row.every((cell) => cell === null || cell === undefined || cell === '')) continue
      try {
        trades.push(rowToTrade(row, mapping, i))
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Parse error'}`)
      }
    }

    return { 
      trades, 
      errors, 
      totalRows: rawData.length - 1, 
      parsedRows: trades.length,
      detectedColumns: headers,
      mapping: mappingDisplay,
    }
  } catch (err) {
    return {
      trades: [],
      errors: [`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`],
      totalRows: 0,
      parsedRows: 0,
      detectedColumns: [],
    }
  }
}

/** Download a sample CSV template */
export function downloadSampleCSV() {
  const csv = `symbol,side,entry_price,exit_price,size,entry_time,exit_time,order_type,pnl,fees,leverage,strategy,notes
SOL-PERP,long,145.50,152.30,2,2025-01-15 10:30:00,2025-01-15 14:20:00,market,13.60,0.58,5,Breakout,breakout trade
BTC-PERP,short,43250.00,42800.00,0.1,2025-01-16 09:00:00,2025-01-16 11:45:00,limit,45.00,0.86,3,Reversal,resistance rejection
ETH-PERP,long,2540.00,2490.00,1,2025-01-17 15:00:00,2025-01-17 18:30:00,market,-50.00,0.51,2,Scalp,stopped out`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'tradevault-sample.csv'
  link.click()
  URL.revokeObjectURL(url)
}
