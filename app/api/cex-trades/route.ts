import { NextResponse } from 'next/server'

// Binance Futures API - fetch trade history
async function fetchBinanceTrades(apiKey: string, apiSecret: string) {
  const { createHmac } = await import('crypto')
  const timestamp = Date.now()
  const params = `timestamp=${timestamp}&recvWindow=10000`
  const signature = createHmac('sha256', apiSecret).update(params).digest('hex')

  const res = await fetch(
    `https://fapi.binance.com/fapi/v1/userTrades?${params}&signature=${signature}`,
    { headers: { 'X-MBX-APIKEY': apiKey } }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Binance API error: ${res.status} - ${text}`)
  }

  const data = await res.json()

  return data.map((t: Record<string, string | number | boolean>, i: number) => ({
    id: `binance-${t.id}-${i}`,
    symbol: `${String(t.symbol).replace('USDT', '')}-PERP`,
    side: t.side === 'BUY' ? 'long' : 'short',
    entryPrice: parseFloat(String(t.price)),
    exitPrice: parseFloat(String(t.price)),
    size: parseFloat(String(t.qty)),
    notionalValue: parseFloat(String(t.quoteQty)),
    entryTime: new Date(Number(t.time) - 60000),
    exitTime: new Date(Number(t.time)),
    orderType: 'market',
    fees: { trading: parseFloat(String(t.commission)), funding: 0, total: parseFloat(String(t.commission)) },
    pnl: parseFloat(String(t.realizedPnl)),
    pnlPercent: parseFloat(String(t.quoteQty)) > 0 ? (parseFloat(String(t.realizedPnl)) / parseFloat(String(t.quoteQty))) * 100 : 0,
    strategy: t.maker ? 'Limit' : 'Market',
    notes: `Binance Futures | ${t.symbol}`,
    leverage: 1,
    liquidated: false,
    source: 'live',
  }))
}

// Bybit API - fetch trade history
async function fetchBybitTrades(apiKey: string, apiSecret: string) {
  const { createHmac } = await import('crypto')
  const timestamp = Date.now()
  const recvWindow = 10000
  const queryString = 'category=linear&limit=100'
  const preSign = `${timestamp}${apiKey}${recvWindow}${queryString}`
  const signature = createHmac('sha256', apiSecret).update(preSign).digest('hex')

  const res = await fetch(
    `https://api.bybit.com/v5/execution/list?${queryString}`,
    {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': String(timestamp),
        'X-BAPI-RECV-WINDOW': String(recvWindow),
      },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bybit API error: ${res.status} - ${text}`)
  }

  const data = await res.json()
  const executions = data?.result?.list || []

  return executions.map((t: Record<string, string | number>, i: number) => ({
    id: `bybit-${t.execId}-${i}`,
    symbol: `${String(t.symbol).replace('USDT', '')}-PERP`,
    side: t.side === 'Buy' ? 'long' : 'short',
    entryPrice: parseFloat(String(t.execPrice)),
    exitPrice: parseFloat(String(t.execPrice)),
    size: parseFloat(String(t.execQty)),
    notionalValue: parseFloat(String(t.execValue || 0)),
    entryTime: new Date(Number(t.execTime) - 60000),
    exitTime: new Date(Number(t.execTime)),
    orderType: String(t.orderType || 'market').toLowerCase(),
    fees: { trading: parseFloat(String(t.execFee || 0)), funding: 0, total: parseFloat(String(t.execFee || 0)) },
    pnl: parseFloat(String(t.closedPnl || 0)),
    pnlPercent: 0,
    strategy: t.orderType === 'Limit' ? 'Limit' : 'Market',
    notes: `Bybit | ${t.symbol}`,
    leverage: 1,
    liquidated: false,
    source: 'live',
  }))
}

export async function POST(request: Request) {
  try {
    const { exchange, apiKey, apiSecret } = await request.json()

    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let trades
    if (exchange === 'binance') {
      trades = await fetchBinanceTrades(apiKey, apiSecret)
    } else if (exchange === 'bybit') {
      trades = await fetchBybitTrades(apiKey, apiSecret)
    } else {
      return NextResponse.json({ error: 'Unsupported exchange' }, { status: 400 })
    }

    return NextResponse.json({ trades, count: trades.length })
  } catch (err) {
    console.error('[CEX API]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}
