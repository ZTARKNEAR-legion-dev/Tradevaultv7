'use client'

import { X, Wallet } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface WalletsModalProps {
  open: boolean
  onClose: () => void
}

export function WalletsModal({ open, onClose }: WalletsModalProps) {
  const wallets = [
    { 
      name: 'Phantom', 
      icon: '👻',
      description: 'Solana & Ethereum wallet. Connects via Web3 API to fetch on-chain trades and balances in real-time.'
    },
    { 
      name: 'Binance Chain', 
      icon: '🔶',
      description: 'BSC/BEP20 wallet integration. Retrieves trading history from Binance Smart Chain using RPC endpoints.'
    },
    { 
      name: 'Magic Eden', 
      icon: '✨',
      description: 'NFT marketplace wallet. Syncs your trading activity and transaction history from Magic Eden protocol.'
    },
    { 
      name: 'Ledger', 
      icon: '🔐',
      description: 'Hardware wallet support via Ledger Live. Sign transactions securely without exposing private keys.'
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect a Wallet
          </DialogTitle>
          <DialogDescription>
            Choose your wallet provider to connect (Coming Soon)
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              disabled
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 transition-all hover:bg-card/80 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-xl">{wallet.icon}</span>
                <div className="font-semibold text-foreground text-sm">{wallet.name}</div>
              </div>
              <div className="text-xs text-muted-foreground leading-tight">{wallet.description}</div>
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-amber-200/20 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
          Wallet connections will be available soon. For now, use Demo Mode or upload your trade data.
        </div>
      </DialogContent>
    </Dialog>
  )
}
