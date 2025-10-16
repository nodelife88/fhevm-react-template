"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, CheckCheck, Lock, Reply, Trash2, Unlock, Vote } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"

interface MessageBubbleProps {
  id: string
  content: string
  sender: string
  timestamp: string
  isOwn: boolean
  isRead?: boolean
  isEncrypted?: boolean
  needsDecryption?: boolean
  quotedMessage?: {
    sender: string
    content: string
  }
  onReply?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onRequestDecryption?: (messageId: string) => void
  onVoteToMakePublic?: (messageId: string) => void
  isInDao?: boolean
}

export function MessageBubble({
  id,
  content,
  sender,
  timestamp,
  isOwn,
  isRead = false,
  isEncrypted = true,
  needsDecryption = false,
  quotedMessage,
  onReply,
  onDelete,
  onRequestDecryption,
  onVoteToMakePublic,
  isInDao = false,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-3 group", isOwn && "flex-row-reverse")}>
      {!isOwn && <UserAvatar address={sender} size="sm" />}

      <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwn && "items-end")}>
        {!isOwn && <span className="text-xs text-muted-foreground font-mono px-1">{sender}</span>}

        {needsDecryption ? (
          <button
            onClick={() => onRequestDecryption?.(id)}
            className={cn(
              "rounded-2xl px-4 py-3 border-2 border-dashed transition-all hover:border-cyan-500/50 hover:bg-cyan-500/5",
              "border-white/20 bg-white/5 cursor-pointer group/decrypt",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-2">
                <Lock className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  Encrypted Message
                  <Unlock className="h-3 w-3 opacity-0 group-hover/decrypt:opacity-100 transition-opacity" />
                </p>
                <p className="text-xs text-white/60">Click to authorize decryption</p>
              </div>
            </div>
          </button>
        ) : (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 space-y-2",
              isOwn ? "bg-primary text-primary-foreground" : "bg-card border border-border",
            )}
          >
            {quotedMessage && (
              <div
                className={cn(
                  "text-xs p-2 rounded border-l-2 mb-2",
                  isOwn ? "bg-primary-foreground/10 border-primary-foreground/30" : "bg-muted/50 border-primary/50",
                )}
              >
                <div className="font-mono text-[10px] mb-1 opacity-70">{quotedMessage.sender}</div>
                <div className="opacity-80 line-clamp-2">{quotedMessage.content}</div>
              </div>
            )}

            <p className="text-sm leading-relaxed break-words">{content}</p>

            {isEncrypted && (
              <div className="flex items-center gap-1.5 pt-1">
                <Lock className="h-3 w-3 opacity-50" />
                <span className="text-[10px] opacity-50 font-mono">FHE encrypted</span>
              </div>
            )}
          </div>
        )}

        <div className={cn("flex items-center gap-2 px-1", isOwn && "flex-row-reverse")}>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          {isOwn && (
            <div className="text-muted-foreground">
              {isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </div>
          )}

          {/* Action buttons - shown on hover */}
          {!needsDecryption && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {onReply && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onReply(id)}>
                  <Reply className="h-3 w-3" />
                </Button>
              )}
              {isInDao && onVoteToMakePublic && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-purple-400 hover:text-purple-300"
                  onClick={() => onVoteToMakePublic(id)}
                  title="Vote to make public"
                >
                  <Vote className="h-3 w-3" />
                </Button>
              )}
              {isOwn && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => onDelete(id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
