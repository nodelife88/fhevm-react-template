"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare, Shield, Sparkles } from "lucide-react"

interface EmptyStateProps {
  type: "no-conversation" | "no-messages"
  onAction?: () => void
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  if (type === "no-conversation") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <MessageSquare className="h-20 w-20 text-primary mx-auto relative" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-semibold">Welcome to FHEVM Messenger</h3>
            <p className="text-muted-foreground leading-relaxed">
              Start a private conversation or join a DAO channel to begin messaging with end-to-end encryption powered
              by FHEVM technology.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>All messages are fully homomorphically encrypted</span>
          </div>
          {onAction && (
            <Button onClick={onAction} size="lg" className="mt-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Start Your First Conversation
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
          <Shield className="h-16 w-16 text-primary/60 mx-auto relative" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No messages yet</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Send your first encrypted message to start the conversation. All messages are secured with FHEVM encryption.
          </p>
        </div>
      </div>
    </div>
  )
}
