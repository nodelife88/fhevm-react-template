"use client"

import type React from "react"

import { useState, useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, X, Lock, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuotedMessage {
  id: string
  sender: string
  content: string
}

interface MessageComposerProps {
  onSend: (content: string, quotedMessageId?: string) => void
  quotedMessage?: QuotedMessage | null
  onClearQuote?: () => void
  placeholder?: string
  disabled?: boolean
}

export function MessageComposer({
  onSend,
  quotedMessage,
  onClearQuote,
  placeholder = "Type an encrypted message...",
  disabled = false,
}: MessageComposerProps) {
  const [message, setMessage] = useState("")
  const [isEncrypting, setIsEncrypting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!message.trim() || disabled || isEncrypting) return

    setIsEncrypting(true)

    // Simulate encryption delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    onSend(message.trim(), quotedMessage?.id)
    setMessage("")
    setIsEncrypting(false)

    if (onClearQuote) {
      onClearQuote()
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  return (
    <div className="border-t border-border bg-background">
      {/* Quoted Message Preview */}
      {quotedMessage && (
        <div className="px-4 pt-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">Replying to {quotedMessage.sender}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{quotedMessage.content}</p>
            </div>
            {onClearQuote && (
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onClearQuote}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isEncrypting}
              className={cn("min-h-[44px] max-h-[200px] resize-none pr-12", "focus-visible:ring-primary")}
              rows={1}
            />
            <div className="absolute right-3 bottom-3">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={disabled || isEncrypting}>
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <Button onClick={handleSend} disabled={!message.trim() || disabled || isEncrypting} className="h-11 px-4">
            {isEncrypting ? (
              <>
                <Lock className="h-4 w-4 mr-2 animate-pulse" />
                Encrypting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>

        {/* Encryption Notice */}
        <div className="flex items-center justify-between mt-3">
          <Badge variant="outline" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            Messages are encrypted with FHEVM
          </Badge>
          <span className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Enter</kbd> to send,{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Shift+Enter</kbd> for new line
          </span>
        </div>
      </div>
    </div>
  )
}
