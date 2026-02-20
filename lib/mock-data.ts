import type { Trade } from './types'

function createTrade(
  id: number,
  symbol: string,
  side: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  size: number,
  entryTime: Date,
  durationMinutes: number,
  orderType: 'market' | 'limit' | 'stop',
  leverage: number,
  notes: string = '',
  liquidated: boolean = false,
  strategy: string = 'Breakout'
): Trade {
  const exitTime = new Date(entryTime.getTime() + durationMinutes * 60 * 1000)
  const notionalValue = size * entryPrice
  const rawPnl = side === 'long'
    ? (exitPrice - entryPrice) * size
    : (entryPrice - exitPrice) * size
  const tradingFee = notionalValue * 0.0005
  const fundingFee = durationMinutes > 480 ? notionalValue * 0.0001 * Math.floor(durationMinutes / 480) : 0
  const totalFees = tradingFee + fundingFee
  const pnl = rawPnl - totalFees
  const pnlPercent = (pnl / notionalValue) * 100

  return {
    id: `trade-${id.toString().padStart(4, '0')}`,
    symbol,
    side,
    entryPrice,
    exitPrice,
    size,
    notionalValue,
    entryTime,
    exitTime,
    orderType,
    fees: { trading: tradingFee, funding: fundingFee, total: totalFees },
    pnl,
    pnlPercent,
    strategy,
    notes,
    leverage,
    liquidated,
    source: 'mock',
  }
}

function d(daysAgo: number, hour: number, minute: number = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date
}

export const mockTrades: Trade[] = [
  // --- Day 1 (60 days ago) ---
  createTrade(1, 'SOL-PERP', 'long', 148.20, 153.85, 12, d(60, 9, 15), 240, 'market', 5, 'Strong breakout above resistance', false, 'Breakout'),
  createTrade(2, 'BTC-PERP', 'short', 67420, 66890, 0.05, d(60, 14, 30), 180, 'limit', 3, 'Rejection at daily high', false, 'Reversal'),
  createTrade(3, 'ETH-PERP', 'long', 3520, 3485, 2, d(60, 20, 0), 90, 'market', 5, 'Failed bounce', false, 'Scalp'),

  // --- Day 2 (57 days ago) ---
  createTrade(4, 'SOL-PERP', 'long', 151.40, 156.20, 15, d(57, 8, 0), 360, 'limit', 5, 'Continuation play', false, 'Trend Following'),
  createTrade(5, 'BONK-PERP', 'long', 0.0000312, 0.0000345, 5000000, d(57, 12, 0), 120, 'market', 10, 'Meme momentum', false, 'Momentum'),
  createTrade(6, 'BTC-PERP', 'long', 67100, 68250, 0.08, d(57, 16, 0), 300, 'limit', 3, '', false, 'Breakout'),

  // --- Day 3 (54 days ago) ---
  createTrade(7, 'ETH-PERP', 'short', 3610, 3540, 3, d(54, 10, 0), 240, 'market', 5, 'Bearish engulfing on 4H', false, 'Breakdown'),
  createTrade(8, 'JUP-PERP', 'long', 1.24, 1.18, 500, d(54, 15, 0), 60, 'stop', 10, 'Stop hunted', false, 'Scalp'),
  createTrade(9, 'SOL-PERP', 'short', 158.90, 155.20, 10, d(54, 18, 0), 180, 'market', 5, 'Evening reversal', false, 'Reversal'),

  // --- Day 4 (51 days ago) ---
  createTrade(10, 'BTC-PERP', 'long', 68500, 69800, 0.1, d(51, 9, 0), 480, 'limit', 3, 'Ascending triangle breakout', false, 'Breakout'),
  createTrade(11, 'WIF-PERP', 'long', 2.85, 3.12, 200, d(51, 11, 0), 120, 'market', 10, 'Meme rally', false, 'Momentum'),
  createTrade(12, 'SOL-PERP', 'long', 155.60, 159.40, 20, d(51, 14, 0), 240, 'limit', 5, '', false, 'Trend Following'),

  // --- Day 5 (48 days ago) ---
  createTrade(13, 'ETH-PERP', 'long', 3580, 3520, 2.5, d(48, 8, 30), 90, 'market', 5, 'Bull trap', false, 'Reversal'),
  createTrade(14, 'SOL-PERP', 'short', 161.20, 157.80, 15, d(48, 13, 0), 240, 'limit', 5, 'Overbought revert', false, 'Breakdown'),
  createTrade(15, 'BTC-PERP', 'short', 70100, 69200, 0.06, d(48, 17, 0), 180, 'market', 3, '', false, 'Trend Following'),

  // --- Day 6 (45 days ago) ---
  createTrade(16, 'BONK-PERP', 'long', 0.0000328, 0.0000389, 8000000, d(45, 10, 0), 360, 'market', 10, 'Major meme pump', false, 'Momentum'),
  createTrade(17, 'SOL-PERP', 'long', 156.30, 162.50, 18, d(45, 12, 0), 300, 'limit', 5, 'Trend continuation', false, 'Trend Following'),
  createTrade(18, 'JUP-PERP', 'short', 1.31, 1.28, 400, d(45, 16, 0), 60, 'market', 10, '', false, 'Scalp'),

  // --- Day 7 (42 days ago) ---
  createTrade(19, 'BTC-PERP', 'long', 69500, 71200, 0.12, d(42, 9, 0), 720, 'limit', 3, 'Swing trade - weekly breakout', false, 'Breakout'),
  createTrade(20, 'ETH-PERP', 'long', 3550, 3680, 4, d(42, 10, 0), 480, 'market', 5, 'ETH catching up to BTC', false, 'Trend Following'),
  createTrade(21, 'SOL-PERP', 'short', 163.80, 165.20, 10, d(42, 18, 0), 60, 'stop', 5, 'Bad timing on reversal call', false, 'Reversal'),

  // --- Day 8 (39 days ago) ---
  createTrade(22, 'WIF-PERP', 'short', 3.45, 3.18, 150, d(39, 11, 0), 240, 'market', 10, 'Meme cooling off', false, 'Breakdown'),
  createTrade(23, 'SOL-PERP', 'long', 160.20, 163.90, 14, d(39, 14, 0), 180, 'limit', 5, '', false, 'Breakout'),
  createTrade(24, 'BTC-PERP', 'long', 70800, 70200, 0.07, d(39, 19, 0), 120, 'market', 3, 'Late entry, already topped', false, 'Scalp'),

  // --- Day 9 (36 days ago) ---
  createTrade(25, 'ETH-PERP', 'short', 3720, 3650, 3, d(36, 8, 0), 360, 'limit', 5, 'Distribution pattern', false, 'Breakdown'),
  createTrade(26, 'SOL-PERP', 'long', 158.40, 164.80, 22, d(36, 12, 0), 480, 'limit', 5, 'Best setup this week', false, 'Breakout'),
  createTrade(27, 'BONK-PERP', 'short', 0.0000365, 0.0000341, 6000000, d(36, 17, 0), 120, 'market', 10, '', false, 'Momentum'),

  // --- Day 10 (33 days ago) ---
  createTrade(28, 'BTC-PERP', 'short', 71500, 69800, 0.15, d(33, 9, 0), 600, 'limit', 3, 'Double top confirmed', false, 'Reversal'),
  createTrade(29, 'JUP-PERP', 'long', 1.22, 1.35, 600, d(33, 13, 0), 240, 'market', 10, 'Ecosystem news pump', false, 'Momentum'),
  createTrade(30, 'SOL-PERP', 'short', 165.40, 162.10, 16, d(33, 18, 0), 180, 'market', 5, '', false, 'Trend Following'),

  // --- Day 11 (30 days ago) ---
  createTrade(31, 'ETH-PERP', 'long', 3600, 3720, 5, d(30, 10, 0), 480, 'limit', 5, 'Oversold bounce', false, 'Reversal'),
  createTrade(32, 'SOL-PERP', 'long', 160.80, 158.20, 12, d(30, 15, 0), 90, 'market', 5, 'Fakeout', false, 'Breakout'),
  createTrade(33, 'WIF-PERP', 'long', 2.95, 3.28, 300, d(30, 17, 0), 240, 'market', 10, 'Social media catalyst', false, 'Momentum'),

  // --- Day 12 (27 days ago) ---
  createTrade(34, 'BTC-PERP', 'long', 69200, 71800, 0.1, d(27, 8, 0), 720, 'limit', 3, 'Weekly support bounce', false, 'Trend Following'),
  createTrade(35, 'SOL-PERP', 'short', 159.80, 156.40, 18, d(27, 12, 0), 360, 'limit', 5, '', false, 'Breakdown'),
  createTrade(36, 'ETH-PERP', 'short', 3680, 3710, 2, d(27, 19, 0), 60, 'stop', 5, 'Stopped out', false, 'Scalp'),

  // --- Day 13 (24 days ago) ---
  createTrade(37, 'BONK-PERP', 'long', 0.0000351, 0.0000298, 10000000, d(24, 10, 0), 180, 'market', 10, 'Meme dump - shouldve cut earlier', false, 'Momentum'),
  createTrade(38, 'SOL-PERP', 'long', 155.20, 161.60, 25, d(24, 14, 0), 360, 'limit', 5, 'Strong accumulation zone', false, 'Trend Following'),
  createTrade(39, 'JUP-PERP', 'short', 1.38, 1.32, 500, d(24, 20, 0), 120, 'market', 10, '', false, 'Scalp'),

  // --- Day 14 (21 days ago) ---
  createTrade(40, 'BTC-PERP', 'long', 71200, 72500, 0.08, d(21, 9, 0), 300, 'market', 3, 'News driven pump', false, 'Momentum'),
  createTrade(41, 'ETH-PERP', 'long', 3650, 3780, 3.5, d(21, 11, 0), 480, 'limit', 5, 'Clean breakout', false, 'Breakout'),
  createTrade(42, 'SOL-PERP', 'long', 160.50, 165.80, 20, d(21, 15, 0), 240, 'limit', 5, 'Momentum trade', false, 'Momentum'),
  createTrade(43, 'WIF-PERP', 'short', 3.15, 3.28, 200, d(21, 19, 0), 60, 'market', 10, 'Wrong side of meme rally', false, 'Reversal'),

  // --- Day 15 (18 days ago) ---
  createTrade(44, 'SOL-PERP', 'short', 167.30, 163.50, 15, d(18, 8, 0), 240, 'limit', 5, 'Profit taking expected', false, 'Breakdown'),
  createTrade(45, 'BTC-PERP', 'short', 73100, 71800, 0.09, d(18, 13, 0), 360, 'market', 3, 'Overextended', false, 'Reversal'),
  createTrade(46, 'BONK-PERP', 'short', 0.0000310, 0.0000325, 7000000, d(18, 18, 0), 120, 'market', 10, 'Caught in squeeze', false, 'Scalp'),

  // --- Day 16 (15 days ago) ---
  createTrade(47, 'ETH-PERP', 'long', 3700, 3820, 4, d(15, 9, 30), 360, 'limit', 5, 'ETH/BTC ratio bouncing', false, 'Trend Following'),
  createTrade(48, 'SOL-PERP', 'long', 162.40, 168.90, 22, d(15, 12, 0), 480, 'limit', 5, 'Solana DeFi narrative', false, 'Breakout'),
  createTrade(49, 'JUP-PERP', 'long', 1.28, 1.42, 700, d(15, 16, 0), 240, 'market', 10, 'Jupiter airdrop hype', false, 'Momentum'),

  // --- Day 17 (12 days ago) ---
  createTrade(50, 'BTC-PERP', 'long', 71500, 73800, 0.14, d(12, 10, 0), 720, 'limit', 3, 'Weekly bull flag', false, 'Breakout'),
  createTrade(51, 'SOL-PERP', 'short', 170.20, 167.80, 12, d(12, 14, 0), 180, 'market', 5, '', false, 'Breakdown'),
  createTrade(52, 'WIF-PERP', 'long', 3.05, 3.42, 250, d(12, 18, 0), 300, 'market', 10, 'Volume spike on meme', false, 'Momentum'),
  createTrade(53, 'ETH-PERP', 'long', 3780, 3750, 2, d(12, 21, 0), 60, 'stop', 5, 'Quick stop loss', false, 'Scalp'),

  // --- Day 18 (9 days ago) ---
  createTrade(54, 'SOL-PERP', 'long', 166.80, 172.50, 18, d(9, 9, 0), 360, 'limit', 5, 'Breakout above consolidation', false, 'Breakout'),
  createTrade(55, 'BTC-PERP', 'short', 74200, 73500, 0.06, d(9, 14, 0), 180, 'market', 3, '', false, 'Trend Following'),
  createTrade(56, 'BONK-PERP', 'long', 0.0000338, 0.0000372, 9000000, d(9, 17, 0), 240, 'market', 10, 'Meme season continues', false, 'Momentum'),
  createTrade(57, 'JUP-PERP', 'long', 1.35, 1.29, 400, d(9, 20, 0), 90, 'market', 10, 'Late entry', false, 'Scalp'),

  // --- Day 19 (6 days ago) ---
  createTrade(58, 'ETH-PERP', 'long', 3820, 3950, 5, d(6, 8, 0), 480, 'limit', 5, 'ETH breakout confirmed', false, 'Breakout'),
  createTrade(59, 'SOL-PERP', 'long', 171.30, 176.80, 25, d(6, 10, 0), 360, 'limit', 5, 'Scaling into strength', false, 'Trend Following'),
  createTrade(60, 'BTC-PERP', 'long', 73600, 75200, 0.12, d(6, 14, 0), 300, 'market', 3, 'All time high push', false, 'Momentum'),
  createTrade(61, 'WIF-PERP', 'short', 3.55, 3.38, 180, d(6, 19, 0), 120, 'limit', 10, '', false, 'Breakdown'),

  // --- Day 20 (4 days ago) ---
  createTrade(62, 'SOL-PERP', 'short', 178.40, 174.20, 15, d(4, 9, 0), 240, 'market', 5, 'Overheated, taking profit on short', false, 'Reversal'),
  createTrade(63, 'BONK-PERP', 'short', 0.0000380, 0.0000362, 6000000, d(4, 12, 0), 180, 'market', 10, '', false, 'Scalp'),
  createTrade(64, 'BTC-PERP', 'long', 74800, 76100, 0.1, d(4, 15, 0), 240, 'limit', 3, 'Trend following', false, 'Trend Following'),
  createTrade(65, 'ETH-PERP', 'short', 3980, 4010, 3, d(4, 20, 0), 60, 'stop', 5, 'Quick reversal stop', false, 'Reversal'),

  // --- Day 21 (3 days ago) ---
  createTrade(66, 'SOL-PERP', 'long', 173.50, 179.20, 20, d(3, 8, 0), 480, 'limit', 5, 'Morning accumulation', false, 'Trend Following'),
  createTrade(67, 'JUP-PERP', 'long', 1.40, 1.52, 800, d(3, 11, 0), 300, 'market', 10, 'JUP governance vote catalyst', false, 'Momentum'),
  createTrade(68, 'BTC-PERP', 'short', 76500, 75200, 0.08, d(3, 16, 0), 180, 'market', 3, 'Evening sell pressure', false, 'Reversal'),
  createTrade(69, 'WIF-PERP', 'long', 3.22, 3.08, 200, d(3, 20, 0), 60, 'market', 10, 'Meme pullback caught me', false, 'Scalp'),

  // --- Day 22 (2 days ago) ---
  createTrade(70, 'ETH-PERP', 'long', 3920, 4080, 4, d(2, 9, 0), 360, 'limit', 5, 'Ethereum upgrade hype', false, 'Breakout'),
  createTrade(71, 'SOL-PERP', 'long', 178.60, 183.40, 22, d(2, 12, 0), 300, 'limit', 5, 'Clean higher low', false, 'Trend Following'),
  createTrade(72, 'BTC-PERP', 'long', 75400, 77200, 0.15, d(2, 15, 0), 360, 'market', 3, 'Institutional buying', false, 'Momentum'),
  createTrade(73, 'BONK-PERP', 'long', 0.0000355, 0.0000398, 12000000, d(2, 18, 0), 240, 'market', 10, 'BONK ecosystem news', false, 'Momentum'),

  // --- Day 23 (1 day ago) ---
  createTrade(74, 'SOL-PERP', 'short', 184.60, 181.20, 18, d(1, 8, 30), 180, 'limit', 5, 'Taking profit on market high', false, 'Breakdown'),
  createTrade(75, 'JUP-PERP', 'short', 1.55, 1.48, 600, d(1, 11, 0), 120, 'market', 10, '', false, 'Scalp'),
  createTrade(76, 'ETH-PERP', 'long', 4050, 4120, 3, d(1, 14, 0), 240, 'limit', 5, 'Dip bought successfully', false, 'Reversal'),
  createTrade(77, 'BTC-PERP', 'long', 76800, 78100, 0.1, d(1, 17, 0), 180, 'market', 3, 'BTC dominance rising', false, 'Trend Following'),
  createTrade(78, 'WIF-PERP', 'long', 3.35, 3.58, 300, d(1, 20, 0), 240, 'market', 10, 'Meme recovery', false, 'Momentum'),

  // --- Day 24 (today) ---
  createTrade(79, 'SOL-PERP', 'long', 180.40, 185.20, 20, d(0, 9, 0), 300, 'limit', 5, 'Morning breakout', false, 'Breakout'),
  createTrade(80, 'BTC-PERP', 'long', 77500, 78800, 0.12, d(0, 11, 0), 240, 'market', 3, 'Continuation', false, 'Trend Following'),
  createTrade(81, 'ETH-PERP', 'short', 4130, 4160, 2.5, d(0, 14, 0), 60, 'stop', 5, 'Wrong side, quick stop', false, 'Reversal'),
  createTrade(82, 'BONK-PERP', 'long', 0.0000388, 0.0000415, 8000000, d(0, 15, 30), 180, 'market', 10, 'BONK breaking out', false, 'Breakout'),
].sort((a, b) => b.exitTime.getTime() - a.exitTime.getTime())

export const SYMBOLS = ['SOL-PERP', 'BTC-PERP', 'ETH-PERP', 'BONK-PERP', 'JUP-PERP', 'WIF-PERP']
