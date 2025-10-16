"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Shield, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface WalletOption {
  id: string
  name: string
  icon: string
  description: string
  installed?: boolean
}

const walletOptions: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    description: "Connect using MetaMask browser extension",
    installed: typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask,
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    description: "Scan with WalletConnect to connect",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
    description: "Connect using Coinbase Wallet",
    installed: typeof window !== "undefined" && !!(window as any).ethereum?.isCoinbaseWallet,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "⭐",
    description: "Connect using Trust Wallet",
  },
]

type ConnectionStatus = "idle" | "connecting" | "connected" | "error"

interface WalletConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const router = useRouter()
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  // Address will be set after successful connection

  const handleConnect = async (walletId: string) => {
    setSelectedWallet(walletId)
    setStatus("connecting")
    setError(null)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    setStatus("connected")

    setTimeout(() => {
      onOpenChange(false)
      router.push("/messages")
      setTimeout(() => {
        setStatus("idle")
        setSelectedWallet(null)
      }, 300)
    }, 1500)
  }

  const handleClose = () => {
    if (status !== "connecting") {
      onOpenChange(false)
      setTimeout(() => {
        setStatus("idle")
        setSelectedWallet(null)
        setError(null)
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-black border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-teal-400" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Choose your preferred wallet to connect to FHEVM Messenger
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {status === "connected" ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-teal-400/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-teal-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-white">Connected Successfully!</p>
                <p className="text-sm text-zinc-400 font-mono">Connected</p>
              </div>
            </div>
          ) : (
            <>
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet.id)}
                  disabled={status === "connecting"}
                  className="w-full p-4 rounded-lg border border-zinc-800 hover:border-teal-400/50 hover:bg-zinc-900/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{wallet.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                          {wallet.name}
                        </p>
                        {wallet.installed && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-400/10 text-teal-400 border border-teal-400/20">
                            Installed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">{wallet.description}</p>
                    </div>
                    {status === "connecting" && selectedWallet === wallet.id && (
                      <Loader2 className="h-5 w-5 text-teal-400 animate-spin" />
                    )}
                  </div>
                </button>
              ))}
            </>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Connection Failed</p>
                <p className="text-sm text-red-300/80 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <Shield className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Secure Connection</p>
            <p className="text-xs text-zinc-400 mt-1">
              Your wallet connection is encrypted and secure. We never store your private keys.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
