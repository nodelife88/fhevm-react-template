"use client"

import type React from "react"
import { useState, useMemo, useCallback, useRef, type ReactElement, memo } from "react"
import { Search, MessageSquare, X, Users } from "lucide-react"
import Avatar from "@/components/shared/Avatar"
import Conversation from "@/components/shared/Conversation"
import { renderTime } from "@/utils"
import type { Conversation as ConversationType } from "@/types"
import { useRainbowKitEthersSigner } from "@/hooks/useRainbowKitEthersSigner"
import { useFHESealrConversationStore } from "@/store/useFHESealrConversationStore"

const SearchInput = memo(
  ({
    search,
    onSearchChange,
    onClear,
  }: {
    search: string
    onSearchChange: (value: string) => void
    onClear: () => void
  }) => {
    return (
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-12 pl-11 pr-11 bg-background/90 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:bg-background transition-all shadow-sm hover:border-border/80"
        />
        {search && (
          <button
            onClick={onClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary/50 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  },
)

const ChatBotConversationList: React.FC = () => {
  const { address } = useRainbowKitEthersSigner()
  const { activeConversation, conversations, setActiveConversation } = useFHESealrConversationStore()

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 100)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch("")
    setDebouncedSearch("")
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
  }, [])

  const getConversationDisplayName = useCallback(
    (address: string | undefined, conversation: ConversationType): string => {
      if (conversation.type === "group") {
        return conversation.senderName || conversation.receiverName || "Group"
      }

      if (address?.toLowerCase() === conversation.sender?.toLowerCase()) {
        return conversation.receiverName || ""
      } else {
        return conversation.senderName || ""
      }
    },
    [],
  )

  const filteredConversations = useMemo(() => {
    if (!debouncedSearch.trim()) return conversations

    return conversations.filter((conversation) => {
      const name = getConversationDisplayName(address, conversation)
      return name.toLowerCase().includes(debouncedSearch.toLowerCase())
    })
  }, [conversations, debouncedSearch, address, getConversationDisplayName])

  const handleChatting = useCallback(
    (conversation: ConversationType): void => {
      setActiveConversation(conversation)
    },
    [setActiveConversation],
  )

  const renderConversation = useCallback(
    (conv: ConversationType): ReactElement => {
      const isDirectChat = Number(conv.ctype) === 0

      if (isDirectChat) {
        return renderDirectChat(conv)
      } else {
        return renderGroupChat(conv)
      }
    },
    [address, activeConversation, getConversationDisplayName, handleChatting],
  )

  const renderDirectChat = useCallback(
    (conv: ConversationType): ReactElement => {
      const displayName = getConversationDisplayName(address, conv)

      return (
        <div
          key={conv.id}
          onClick={() => handleChatting(conv)}
          className={`mx-2 mb-1.5 rounded-xl transition-all cursor-pointer relative overflow-hidden group ${
            Number(activeConversation?.id) === Number(conv.id)
              ? "bg-primary/10 shadow-sm ring-1 ring-primary/30"
              : "hover:bg-secondary/60 hover:shadow-sm"
          }`}
        >
          {Number(activeConversation?.id) === Number(conv.id) && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/60 rounded-l-xl" />
          )}
          <div className="pl-3">
            <Conversation
              name={displayName}
              info={renderTime(conv.createdAt ?? 0)}
              active={Number(activeConversation?.id) === Number(conv.id)}
            >
              <Avatar name={displayName} />
            </Conversation>
          </div>
        </div>
      )
    },
    [address, activeConversation, getConversationDisplayName, handleChatting],
  )

  const renderGroupChat = useCallback(
    (conv: ConversationType): ReactElement => {
      return (
        <div
          key={conv.id}
          onClick={() => handleChatting(conv)}
          className={`mx-2 mb-1.5 rounded-xl transition-all cursor-pointer relative overflow-hidden group ${
            Number(activeConversation?.id) === Number(conv.id)
              ? "bg-primary/10 shadow-sm ring-1 ring-primary/30"
              : "hover:bg-secondary/60 hover:shadow-sm"
          }`}
        >
          {Number(activeConversation?.id) === Number(conv.id) && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/60 rounded-l-xl" />
          )}
          <div className="pl-3">
            <Conversation
              name={conv.senderName || conv.receiverName || "Group"}
              info={`${conv.members?.length || 0} members • ${renderTime(conv.createdAt ?? 0)}`}
              active={Number(activeConversation?.id) === Number(conv.id)}
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </Conversation>
          </div>
        </div>
      )
    },
    [activeConversation, handleChatting],
  )

  return (
    <section className="h-full flex flex-col bg-gradient-to-b from-card/60 to-card/40 backdrop-blur-md border-r border-border/50">
      <div className="p-6 border-b border-border/60 bg-card/90 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-3 text-foreground">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm ring-1 ring-primary/20">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          Messages
        </h2>
        <SearchInput search={search} onSearchChange={handleSearchChange} onClear={handleClearSearch} />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent hover:scrollbar-thumb-border/60">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5 shadow-lg ring-1 ring-primary/10">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground mb-2">
              {debouncedSearch ? "No matches found" : "No conversations"}
            </p>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              {debouncedSearch ? "Try a different search term" : "Start a new chat to begin messaging"}
            </p>
          </div>
        ) : (
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Conversations
            </div>
            {filteredConversations.map((conversation) => renderConversation(conversation))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ChatBotConversationList
