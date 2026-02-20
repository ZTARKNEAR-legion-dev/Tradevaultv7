export const DERIVERSE_PROGRAM_ID = 'CDESjex4EDBKLwx9ZPzVbjiHEHatasb5fhSJZMzNfvw2'
export const DERIVERSE_VERSION = 6
export const DEVNET_RPC_URL = 'https://api.devnet.solana.com'

// Token symbols mapping for Deriverse markets
export const MARKET_SYMBOLS: Record<number, string> = {
  0: 'SOL-PERP',
  1: 'BTC-PERP',
  2: 'ETH-PERP',
  3: 'BONK-PERP',
  4: 'JUP-PERP',
  5: 'WIF-PERP',
}

export const ORDER_TYPE_MAP: Record<number, 'market' | 'limit' | 'stop'> = {
  0: 'market',
  1: 'limit',
  2: 'stop',
}
