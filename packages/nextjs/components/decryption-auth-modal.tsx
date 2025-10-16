"use client"

import { useState } from "react"
import { X, Lock, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "./user-avatar"

interface DecryptionAuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthorize: () => void
  onDeny: () => void
  messageCount: number
  senderAddress: string
  isGroupMessage?: boolean
  groupName?: string
}

export function DecryptionAuthModal({
  open,
  onOpenChange,
  onAuthorize,
  onDeny,
  messageCount,
  senderAddress,
  isGroupMessage = false,
  groupName,
}: DecryptionAuthModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  if (!open) return null

  const handleAuthorize = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    onAuthorize()
    setIsProcessing(false)
  }

  const handleDeny = () => {
    onDeny()
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleDeny}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-3 border border-primary/20">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Authorize Decryption</h2>
            <p className="text-sm text-muted-foreground">FHEVM Security Check</p>
          </div>
        </div>

        {/* Message Info */}
        <div className="mb-6 space-y-4 rounded-xl border border-border bg-secondary/50 p-4">
          <div className="flex items-start gap-3">
            <UserAvatar address={senderAddress} size="md" />
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium">{isGroupMessage ? groupName : "Direct Message"}</span>
                {isGroupMessage && (
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">Group</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                From: {senderAddress.slice(0, 6)}...{senderAddress.slice(-4)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {messageCount} encrypted {messageCount === 1 ? "message" : "messages"} to decrypt
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-background/80 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Encrypted Content</span>
            </div>
            <p className="font-mono text-sm text-foreground/80">
              0x{Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}...
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          <div className="text-sm text-amber-200/90">
            <p className="mb-1 font-medium">Security Notice</p>
            <p className="text-amber-200/70">
              This will use your private key to decrypt{" "}
              {messageCount === 1 ? "this message" : `all ${messageCount} messages`}. Only authorize if you trust the
              sender.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleDeny} variant="outline" className="flex-1 bg-transparent" disabled={isProcessing}>
            Deny
          </Button>
          <Button
            onClick={handleAuthorize}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Decrypting...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Authorize
              </>
            )}
          </Button>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-xs text-muted-foreground">Powered by Zama FHEVM • End-to-End Encrypted</p>
      </div>
    </div>
  )
}
