"use client"

import { useState, useRef, useEffect } from "react"
import { MessageBubble } from "@/components/message-bubble"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Shield, Loader2 } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { DecryptionAuthModal } from "@/components/decryption-auth-modal"

interface Message {
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
}

interface MessageListProps {
  messages: Message[]
  currentUser: string
  onReply?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onLoadMore?: () => Promise<void>
  hasMore?: boolean
  onVoteToMakePublic?: (messageId: string) => void
  isInDao?: boolean
}

export function MessageList({
  messages,
  currentUser,
  onReply,
  onDelete,
  onLoadMore,
  hasMore = false,
  onVoteToMakePublic,
  isInDao = false,
}: MessageListProps) {
  const [decryptionModal, setDecryptionModal] = useState<{
    isOpen: boolean
    messageId: string | null
    message: Message | null
  }>({
    isOpen: false,
    messageId: null,
    message: null,
  })

  const [decryptedMessages, setDecryptedMessages] = useState<Set<string>>(new Set())
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const previousScrollHeight = useRef<number>(0)

  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")

    if (!scrollContainer) return

    const handleScroll = async () => {
      const { scrollTop, scrollHeight } = scrollContainer

      // If scrolled near top (within 100px) and has more messages
      if (scrollTop < 100 && hasMore && !isLoadingMore && onLoadMore) {
        setIsLoadingMore(true)
        previousScrollHeight.current = scrollHeight

        try {
          await onLoadMore()
        } finally {
          setIsLoadingMore(false)
        }
      }
    }

    scrollContainer.addEventListener("scroll", handleScroll)
    return () => scrollContainer.removeEventListener("scroll", handleScroll)
  }, [hasMore, isLoadingMore, onLoadMore])

  useEffect(() => {
    if (isLoadingMore) return

    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
    if (!scrollContainer || previousScrollHeight.current === 0) return

    const newScrollHeight = scrollContainer.scrollHeight
    const scrollDiff = newScrollHeight - previousScrollHeight.current

    if (scrollDiff > 0) {
      scrollContainer.scrollTop = scrollDiff
    }
  }, [messages.length, isLoadingMore])

  const handleRequestDecryption = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (message) {
      setDecryptionModal({
        isOpen: true,
        messageId,
        message,
      })
    }
  }

  const handleAuthorizeDecryption = () => {
    if (decryptionModal.messageId) {
      setDecryptedMessages((prev) => new Set(prev).add(decryptionModal.messageId!))
    }
    setDecryptionModal({ isOpen: false, messageId: null, message: null })
  }

  if (messages.length === 0) {
    return <EmptyState type="no-messages" />
  }

  return (
    <>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-6 space-y-4">
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading older messages...</span>
            </div>
          )}

          {!hasMore && messages.length > 20 && (
            <div className="flex items-center justify-center py-4">
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Beginning of conversation
              </Badge>
            </div>
          )}

          {/* Encryption notice */}
          <div className="flex items-center justify-center mb-6">
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              End-to-end encrypted with FHEVM
            </Badge>
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              id={message.id}
              content={message.content}
              sender={message.sender}
              timestamp={message.timestamp}
              isOwn={message.isOwn}
              isRead={message.isRead}
              isEncrypted={message.isEncrypted}
              needsDecryption={message.needsDecryption && !decryptedMessages.has(message.id)}
              quotedMessage={message.quotedMessage}
              onReply={onReply}
              onDelete={onDelete}
              onRequestDecryption={handleRequestDecryption}
              onVoteToMakePublic={onVoteToMakePublic}
              isInDao={isInDao}
            />
          ))}
        </div>
      </ScrollArea>

      {decryptionModal.message && (
        <DecryptionAuthModal
          isOpen={decryptionModal.isOpen}
          onClose={() => setDecryptionModal({ isOpen: false, messageId: null, message: null })}
          onAuthorize={handleAuthorizeDecryption}
          messageFrom={decryptionModal.message.sender}
          messagePreview="0x4f8a...9c2d"
          timestamp={decryptionModal.message.timestamp}
          isGroupMessage={false}
        />
      )}
    </>
  )
}
