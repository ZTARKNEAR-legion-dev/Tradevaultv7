<div align="center">

# 🛡️ TradeVault

### Professional Trading Analytics Dashboard for Crypto Derivatives

*A comprehensive, security-first trading journal and analytics platform designed for serious traders*

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Security](#-security)

</div>

---

## ✨ Features

### 📊 Core Analytics
- 💰 Comprehensive Performance Metrics - PnL, win rate, profit factor, Sharpe ratio, Sortino ratio, max drawdown
- 📅 Interactive Performance Calendar - Visual heatmap showing daily trading activity over 90 days
- 🎯 Strategy Analysis - Compare different trading strategies and identify best/worst performing days
- ⏰ Time-Based Analysis - Discover optimal trading hours and day-of-week patterns
- 🏢 Exchange Breakdown - Track volume and fees across different trading platforms
- ⚠️ Risk Management - Advanced risk metrics including volatility, expectancy, and drawdown tracking

### 🎨 User Experience
- 🎓 Beginner Mode - Plain-language explanations for all metrics with helpful tooltips
- 🚀 Pro Mode - Advanced analytics with technical terminology for experienced traders
- ✍️ Manual Trade Entry - Add trades manually with smart date parsing (type "20" for current month's 20th day)
- ✏️ Trade Editing - Full CRUD operations on your trading journal
- 🔍 Filtering & Search - Filter by symbol, side, order type, date range
- 👆 Clickable Insights - Click largest win/loss cards to jump to trade details

### 🔒 Security Features
- 🔐 AES-256-GCM Encryption - All manual trades encrypted in localStorage with device-specific keys
- 🛡️ XSS Protection - Comprehensive input sanitization prevents code injection attacks
- 🔧 Security Headers - HSTS, CSP, X-Frame-Options, and more via Next.js config
- 💾 Encrypted Backups - Export/import trades with password protection (250k PBKDF2 iterations)
- 🏠 Zero Trust Architecture - All data stays on your device, no server-side storage

---

## 🛠️ Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui + Radix UI
- Charts: Recharts
- Date Handling: date-fns
- State Management: React Context API
- Encryption: Web Crypto API (SubtleCrypto)

---

## 🚀 Getting Started

### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/tradevault.git
cd tradevault

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 📁 Project Structure

```
tradevault/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout with fonts
│   └── globals.css        # Global styles and design tokens
├── components/
│   ├── dashboard/         # Dashboard components
│   │   ├── stats-overview.tsx
│   │   ├── pnl-chart.tsx
│   │   ├── performance-heatmap.tsx
│   │   ├── trade-journal.tsx
│   │   └── ...
│   ├── providers/         # React context providers
│   │   └── data-provider.tsx
│   ├── ui/                # shadcn/ui components
│   └── ...
├── lib/
│   ├── analytics.ts       # Core analytics calculations
│   ├── types.ts           # TypeScript type definitions
│   ├── crypto.ts          # Encryption utilities
│   ├── sanitize.ts        # XSS protection
│   └── mock-data.ts       # Demo data generator
└── public/                # Static assets
```

---

## 📚 Code Documentation

### 🔑 Key Functions

#### `calculateMetrics(trades: Trade[]): TradeMetrics`
Calculates comprehensive trading metrics including PnL, win rate, profit factor, and more.

```typescript
import { calculateMetrics } from '@/lib/analytics'

const metrics = calculateMetrics(myTrades)
console.log(`Win Rate: ${metrics.winRate.toFixed(1)}%`)
console.log(`Profit Factor: ${metrics.profitFactor.toFixed(2)}`)
```

#### `calculateRiskMetrics(trades: Trade[]): RiskMetrics`
Computes advanced risk-adjusted performance metrics.

```typescript
import { calculateRiskMetrics } from '@/lib/analytics'

const risk = calculateRiskMetrics(trades)
if (risk.sharpeRatio > 2) {
  console.log('Excellent risk-adjusted returns!')
}
```

#### `secureStorage.setItem(key: string, value: string): Promise<void>`
Encrypts and stores data in localStorage with AES-256-GCM.

```typescript
import { secureStorage } from '@/lib/crypto'

await secureStorage.setItem('my-data', JSON.stringify(sensitiveData))
const retrieved = await secureStorage.getItem('my-data')
```

#### `sanitizeText(input: string): string`
Sanitizes user input to prevent XSS attacks.

```typescript
import { sanitizeText, sanitizeSymbol } from '@/lib/sanitize'

const safeNotes = sanitizeText(userInput)
const safeSymbol = sanitizeSymbol(symbolInput)
```

---

## 🔒 Security Best Practices

### 🛡️ Data Protection
- All manual trades are encrypted before localStorage storage
- Device-specific encryption keys derived via PBKDF2 (100,000 iterations)
- AES-256-GCM provides authenticated encryption with integrity checking

### ✅ Input Validation
- All user inputs sanitized to strip HTML, scripts, and dangerous protocols
- Special characters escaped in symbols, numbers, and text fields
- Form validation prevents invalid trade data entry

### 🔧 Secure Headers
```javascript
// next.config.mjs includes:
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
```

### 💾 Backup Security
- Backups use password-derived keys (250,000 PBKDF2 iterations)
- AES-256-GCM encryption with random salts and IVs
- Version control for format compatibility

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. 📝 Code Style - Follow the existing TypeScript/React patterns
2. 📖 Documentation - Add JSDoc comments for all exported functions
3. 🔒 Security - Never store unencrypted sensitive data
4. 🧪 Testing - Test all edge cases (empty arrays, invalid dates, etc.)

---

## ⚡ Performance Optimization

- 🧠 Memoized calculations with `useMemo` for expensive operations
- 🚀 Lazy loading of chart components
- ⏩ Efficient filtering with early returns
- 🔄 Minimal re-renders with React Context

---

## 📄 License

MIT License - see LICENSE file for details

---

## 💬 Support

For issues, questions, or feature requests, please open a GitHub issue.

---

<div align="center">

**Built with ❤️ for serious traders**

*TradeVault - Secure. Powerful. Professional.*

</div>
