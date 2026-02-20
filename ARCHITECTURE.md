<div align="center">

# 🏗️ TradeVault Architecture

*Comprehensive technical documentation for system design and implementation*

</div>

---

## 📋 System Overview

TradeVault is a client-side trading analytics application built with Next.js 15, leveraging the App Router for optimal performance and modern React patterns. The architecture prioritizes security, maintainability, and user experience.

---

## 🎯 Architecture Principles

### 1️⃣ Client-Side First
- 🌐 Zero Backend Dependencies - All data processing happens in the browser
- 💾 LocalStorage Persistence - Encrypted user data stays on device
- 🔒 No External API Calls - Eliminates data breach risks from server compromises

### 2️⃣ Security by Design
- 🛡️ Defense in Depth - Multiple layers of protection (encryption, sanitization, CSP headers)
- 🚫 Zero Trust - Assume all user input is malicious until sanitized
- 🔐 Cryptographic Standards - AES-256-GCM, PBKDF2 with high iteration counts

### 3️⃣ Performance Optimization
- 🧠 Memoization - Heavy calculations cached with `useMemo` and `useCallback`
- 🚀 Lazy Loading - Chart components loaded on-demand
- ⚡ Efficient Filtering - Early returns prevent unnecessary iterations

---

## 🌲 Component Hierarchy

```
App (page.tsx)
├── LandingPage (initial view)
│   └── Logo, Features, CTAs
│
└── Dashboard (main application)
    ├── Header
    │   ├── Logo
    │   ├── Theme Toggle
    │   ├── Level Toggle (Beginner/Pro)
    │   ├── Import Data Button
    │   └── Settings Menu
    │
    ├── FilterBar (symbol, date, side, order type)
    │
    ├── Tabs (Overview | Analysis | Journal | Risk)
    │
    ├── Overview Tab
    │   ├── StatsOverview (key metrics)
    │   ├── PnlChart (cumulative performance)
    │   ├── WinLossAnalysis
    │   ├── LongShortRatio
    │   ├── PerformanceHeatmap (calendar)
    │   └── DayStrategyAnalysis
    │
    ├── Analysis Tab
    │   ├── SymbolPnlBreakdown
    │   ├── OrderTypeAnalysis
    │   ├── TimeAnalysis (hourly)
    │   ├── VolumeFeeChart
    │   ├── StreakTracker
    │   └── ExchangeAnalysis
    │
    ├── Journal Tab
    │   └── TradeJournal (filterable table with CRUD)
    │
    ├── Risk Tab
    │   ├── RiskMetricsPanel (Sharpe, Sortino, etc.)
    │   ├── StreakTracker
    │   └── SecureBackup (encrypted export/import)
    │
    └── Modals
        ├── AddTradeManual
        ├── EditTradeModal
        ├── TipsModal
        ├── WalletsModal
        ├── ComingSoonModal
        └── ConfirmModal
```

---

## 🔄 Data Flow

### 📊 State Management

```
DataProvider (React Context)
    ↓
├── Mock Trades (demo data)
├── Manual Trades (user-added, encrypted in localStorage)
├── Filters (symbol, date, side, order type)
├── Pro/Beginner Mode Toggle
└── Filtered Trades (computed from mock + manual + filters)
    ↓
    Consumed by all dashboard components
```

### 🔁 Trade Lifecycle

```
1. User Action
   ├── Upload CSV → Parse → Validate → Store (coming soon)
   ├── Add Manual → Form → Sanitize → Encrypt → Store
   └── Edit Trade → Form → Sanitize → Encrypt → Update

2. Storage
   └── secureStorage.setItem()
       └── Derive Key (PBKDF2) → Encrypt (AES-256-GCM) → localStorage

3. Retrieval
   └── secureStorage.getItem()
       └── localStorage → Decrypt (AES-256-GCM) → Verify → Return

4. Display
   └── filterTrades() → calculateMetrics() → Render
```

---

## 🔒 Security Architecture

### 🛡️ Layer 1: Input Sanitization
```typescript
User Input
    ↓
sanitizeText() / sanitizeSymbol() / sanitizeNumber()
    ↓
- Strip HTML tags (<script>, <iframe>, etc.)
- Remove JavaScript protocols (javascript:, data:)
- Escape event handlers (onclick, onerror)
- Validate format constraints
    ↓
Safe Data → Processing
```

### 🔐 Layer 2: Encrypted Storage
```typescript
Trade Data
    ↓
JSON.stringify()
    ↓
secureStorage.setItem(key, value)
    ↓
- Generate random IV (12 bytes)
- Derive key from device identifier (PBKDF2, 100k iterations)
- Encrypt with AES-256-GCM
- Prepend IV to ciphertext
    ↓
localStorage (encrypted)
```

### 🔧 Layer 3: HTTP Headers
```
Client Request
    ↓
Next.js Middleware (next.config.mjs)
    ↓
Headers Applied:
- Strict-Transport-Security (force HTTPS)
- Content-Security-Policy (restrict resource loading)
- X-Frame-Options (prevent clickjacking)
- X-Content-Type-Options (prevent MIME sniffing)
- X-XSS-Protection (browser XSS filter)
    ↓
Response to Client
```

---

## 📊 Analytics Engine

### Metrics Calculation Pipeline

```
trades: Trade[]
    ↓
filterTrades(trades, filters)
    ↓
Filtered Trades
    ↓
    ├── calculateMetrics() → Basic stats (PnL, win rate, etc.)
    ├── calculateRiskMetrics() → Sharpe, Sortino, drawdown
    ├── calculateDailyPnl() → Time series data
    ├── calculateCalendarData() → Heatmap visualization
    ├── calculateStrategyPerformance() → Strategy breakdown
    └── calculateStreaks() → Win/loss streaks
    ↓
Rendered in UI Components
```

### Key Calculations

**Sharpe Ratio**
```
Annual Return / Annual Volatility
where Volatility = σ(daily returns) × √252
```

**Sortino Ratio**
```
Annual Return / Downside Deviation
where Downside Deviation = √(Σ negative returns² / n)
```

**Max Drawdown**
```
Max(Peak - Trough) / Peak
Track cumulative PnL, identify largest decline from peak
```

**Profit Factor**
```
Gross Profit / |Gross Loss|
Measures $ won per $ lost
```

---

## File Organization

### `/lib` - Core Utilities
- `analytics.ts` - All calculation functions (metrics, risk, performance)
- `types.ts` - TypeScript interfaces and type definitions
- `crypto.ts` - Encryption/decryption utilities
- `sanitize.ts` - XSS protection and input validation
- `mock-data.ts` - Demo trade generator

### `/components/dashboard` - UI Components
- Each component is self-contained with own logic
- Props drilling minimized via DataProvider context
- Reusable `StatCard`, `MetricCard` patterns

### `/components/ui` - shadcn/ui Base Components
- Atomic design pattern (Button, Card, Input, etc.)
- Radix UI primitives for accessibility
- Tailwind CSS for styling

### `/app` - Next.js App Router
- `page.tsx` - Main application entry point
- `layout.tsx` - Root layout with fonts and metadata
- `globals.css` - Design tokens and utility classes

---

## Performance Optimizations

### 1. Memoization Strategy
```typescript
// Heavy calculations cached
const metrics = useMemo(() => calculateMetrics(filteredTrades), [filteredTrades])
const risk = useMemo(() => calculateRiskMetrics(filteredTrades), [filteredTrades])

// Callbacks stabilized
const handleTrade = useCallback((id: string) => { ... }, [])
```

### 2. Conditional Rendering
```typescript
// Only render active tab
{activeTab === 'overview' && <OverviewComponents />}
{activeTab === 'analysis' && <AnalysisComponents />}
```

### 3. Virtualization (Future)
- Trade journal uses basic pagination
- Virtual scrolling can be added for 10k+ trades

---

## Testing Strategy

### Current Coverage
- TypeScript strict mode catches type errors
- Runtime error boundaries prevent crashes
- Input validation prevents invalid data

### Recommended Additions
```typescript
// Unit tests for analytics
describe('calculateMetrics', () => {
  it('handles empty trade array', () => {
    const result = calculateMetrics([])
    expect(result.totalPnl).toBe(0)
  })
})

// Integration tests for encryption
describe('secureStorage', () => {
  it('encrypts and decrypts data', async () => {
    await secureStorage.setItem('test', 'value')
    const result = await secureStorage.getItem('test')
    expect(result).toBe('value')
  })
})
```

---

## Deployment

### Build Process
```bash
pnpm build
```

Generates:
- Static HTML/CSS/JS in `.next/` folder
- Optimized images and assets
- Security headers injected via middleware

### Hosting Options
- Vercel (recommended) - Zero-config deployment
- Netlify - Static site hosting
- Cloudflare Pages - CDN-based hosting

### Environment Variables
None required for core functionality (client-side only). Future integrations may need:
- `NEXT_PUBLIC_API_URL` for exchange APIs
- `NEXT_PUBLIC_SUPABASE_URL` for cloud backup

---

## Future Enhancements

### Short Term
- Unit test coverage (Jest + React Testing Library)
- Onboarding tour for first-time users
- PDF export for trade reports

### Medium Term
- Live exchange integrations (Binance, Bybit, OKX)
- Cloud backup with E2E encryption
- Multi-account support

### Long Term
- Mobile app (React Native)
- AI-powered trade insights
- Social features (share strategies)

---

## Contributing Guidelines

### Code Standards
1. TypeScript First - No `any` types, use strict mode
2. JSDoc Comments - Document all exported functions
3. Security Review - Sanitize all inputs, encrypt sensitive data
4. Performance Check - Memoize expensive calculations

### Pull Request Checklist
- [ ] TypeScript compiles with no errors
- [ ] All inputs sanitized
- [ ] Sensitive data encrypted
- [ ] JSDoc added for new functions
- [ ] Tested with empty/invalid data
- [ ] No console.log statements left

---

## Contact

For architecture questions or contribution discussions, open a GitHub issue.
