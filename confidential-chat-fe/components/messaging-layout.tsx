"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageList } from "@/components/message-list"
import { MessageComposer } from "@/components/message-composer"
import { DaoChannelHeader } from "@/components/dao-channel-header"
import { DaoMemberList } from "@/components/dao-member-list"
import { EmptyState } from "@/components/empty-state"
import { UserAvatar } from "@/components/user-avatar"
import { NewMessageModal } from "@/components/new-message-modal"
import { DecryptionAuthModal } from "@/components/decryption-auth-modal"
import { CreateDaoModal } from "@/components/create-dao-modal"
import { DaoSettingsModal } from "@/components/dao-settings-modal"
import { PublicDisclosureVoteModal } from "@/components/public-disclosure-vote-modal"
import { UserSettingsModal } from "@/components/user-settings-modal"
import { NotificationCenter } from "@/components/notification-center"
import { Shield, Search, Plus, Hash, MessageSquare, Users, Settings, LogOut, X, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

type ConversationType = "direct" | "dao"

interface Conversation {
  id: string
  name: string
  type: ConversationType
  lastMessage?: string
  timestamp?: string
  unread?: number
  avatar?: string
}

interface Message {
  id: string
  content: string
  sender: string
  timestamp: string
  isOwn: boolean
  isRead?: boolean
  isEncrypted?: boolean
  quotedMessage?: {
    sender: string
    content: string
  }
  needsDecryption?: boolean
}

const mockDirectMessages: Conversation[] = [
  {
    id: "1",
    name: "0x742d...3f4a",
    type: "direct",
    lastMessage: "Thanks for the update!",
    timestamp: "2m ago",
    unread: 2,
  },
  {
    id: "2",
    name: "0x9f3e...2a1b",
    type: "direct",
    lastMessage: "See you tomorrow",
    timestamp: "1h ago",
  },
  {
    id: "3",
    name: "0x5d8c...4e7f",
    type: "direct",
    lastMessage: "Got it, will do",
    timestamp: "3h ago",
  },
]

const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "1",
      content: "Hey! How's the FHEVM integration going?",
      sender: "0x742d...3f4a",
      timestamp: "10:30 AM",
      isOwn: false,
      isRead: true,
      isEncrypted: false,
    },
    {
      id: "2",
      content: "Going well! Just finished implementing the encryption layer.",
      sender: "0x1a2b...5c6d",
      timestamp: "10:32 AM",
      isOwn: true,
      isRead: true,
      isEncrypted: false,
    },
    {
      id: "3",
      content: "That's awesome! Can you share the contract address?",
      sender: "0x742d...3f4a",
      timestamp: "10:35 AM",
      isOwn: false,
      isRead: true,
      isEncrypted: false,
    },
    {
      id: "4",
      content: "Sure, it's deployed at 0x1234...5678 on Zama testnet",
      sender: "0x1a2b...5c6d",
      timestamp: "10:36 AM",
      isOwn: true,
      isRead: true,
      isEncrypted: false,
      quotedMessage: {
        sender: "0x742d...3f4a",
        content: "That's awesome! Can you share the contract address?",
      },
    },
    {
      id: "5",
      content: "Thanks for the update!",
      sender: "0x742d...3f4a",
      timestamp: "10:38 AM",
      isOwn: false,
      isRead: false,
      isEncrypted: true,
      needsDecryption: true,
    },
  ],
  "2": [
    {
      id: "6",
      content: "Meeting at 3pm?",
      sender: "0x9f3e...2a1b",
      timestamp: "9:00 AM",
      isOwn: false,
      isRead: true,
      isEncrypted: false,
    },
    {
      id: "7",
      content: "Yes, sounds good!",
      sender: "0x1a2b...5c6d",
      timestamp: "9:05 AM",
      isOwn: true,
      isRead: true,
      isEncrypted: false,
    },
  ],
}

export function MessagingLayout() {
  const mockAddress = "0x1a2b...5c6d"
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<"direct" | "dao">("direct")
  const [showDaoMembers, setShowDaoMembers] = useState(true)
  const [quotedMessage, setQuotedMessage] = useState<{ id: string; sender: string; content: string } | null>(null)
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [showDecryptionModal, setShowDecryptionModal] = useState(false)
  const [showCreateDaoModal, setShowCreateDaoModal] = useState(false)
  const [showDaoSettingsModal, setShowDaoSettingsModal] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [hasCheckedDecryption, setHasCheckedDecryption] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Message[]>([])
  const [daoChannels, setDaoChannels] = useState<Conversation[]>([
    {
      id: "dao-1",
      name: "general",
      type: "dao",
      lastMessage: "New proposal submitted",
      timestamp: "5m ago",
      unread: 5,
    },
    {
      id: "dao-2",
      name: "governance",
      type: "dao",
      lastMessage: "Vote ends in 24h",
      timestamp: "30m ago",
      unread: 1,
    },
    {
      id: "dao-3",
      name: "development",
      type: "dao",
      lastMessage: "Smart contract deployed",
      timestamp: "2h ago",
    },
  ])
  const [daoMembers, setDaoMembers] = useState([
    { address: "0x1a2b...5c6d", role: "admin" as const, joinedAt: "2024-01-15" },
    { address: "0x742d...3f4a", role: "admin" as const, joinedAt: "2024-01-16" },
    { address: "0x9f3e...2a1b", role: "member" as const, joinedAt: "2024-02-01" },
    { address: "0x5d8c...4e7f", role: "member" as const, joinedAt: "2024-02-10" },
    { address: "0x3b7a...9c2d", role: "member" as const, joinedAt: "2024-02-15" },
  ])
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [selectedMessageForVote, setSelectedMessageForVote] = useState<string | null>(null)
  const [showUserSettings, setShowUserSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(2)

  const conversationsList = sidebarTab === "direct" ? mockDirectMessages : daoChannels

  useEffect(() => {
    if (searchQuery.trim() && activeConversation) {
      setIsSearching(true)
      // Simulate search delay
      const timer = setTimeout(() => {
        const results = messages.filter((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
        setSearchResults(results)
        setIsSearching(false)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery, messages, activeConversation])

  useEffect(() => {
    if (activeConversation) {
      const conversationMessages = mockMessages[activeConversation] || []
      setMessages(conversationMessages)
      setSearchQuery("")
      setSearchResults([])

      if (!hasCheckedDecryption[activeConversation]) {
        const encryptedMessages = conversationMessages.filter((m) => m.isEncrypted)
        if (encryptedMessages.length > 0) {
          setShowDecryptionModal(true)
        }
        setHasCheckedDecryption((prev) => ({ ...prev, [activeConversation]: true }))
      }
    }
  }, [activeConversation, hasCheckedDecryption])

  const handleReply = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (message) {
      setQuotedMessage({
        id: message.id,
        sender: message.sender,
        content: message.content,
      })
    }
  }

  const handleDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }

  const handleSendMessage = (content: string, quotedMessageId?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: mockAddress,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
      isRead: false,
      isEncrypted: false,
      quotedMessage: quotedMessageId
        ? (() => {
            const quoted = messages.find((m) => m.id === quotedMessageId)
            return quoted ? { sender: quoted.sender, content: quoted.content } : undefined
          })()
        : undefined,
    }
    setMessages((prev) => [...prev, newMessage])
    setQuotedMessage(null)
  }

  const handleCreateDao = (dao: {
    name: string
    description: string
    members: { address: string; role: string }[]
    isPublic: boolean
  }) => {
    const newDao: Conversation = {
      id: `dao-${Date.now()}`,
      name: dao.name,
      type: "dao",
      lastMessage: "Channel created",
      timestamp: "now",
    }
    setDaoChannels((prev) => [...prev, newDao])
    setActiveConversation(newDao.id)
  }

  const handleAddMember = (address: string, role: "admin" | "member") => {
    setDaoMembers((prev) => [
      ...prev,
      {
        address,
        role,
        joinedAt: new Date().toISOString().split("T")[0],
      },
    ])
  }

  const handleRemoveMember = (address: string) => {
    setDaoMembers((prev) => prev.filter((m) => m.address !== address))
  }

  const handleUpdateRole = (address: string, role: "admin" | "member") => {
    setDaoMembers((prev) => prev.map((m) => (m.address === address ? { ...m, role } : m)))
  }

  const handleMakePublic = () => {
    setShowDaoSettingsModal(true)
  }

  const handleStartConversation = (address: string) => {
    if (sidebarTab === "dao") {
      setShowCreateDaoModal(true)
      setShowNewMessageModal(false)
      return
    }

    const existingConv = mockDirectMessages.find((conv) => conv.name === address)
    if (existingConv) {
      setActiveConversation(existingConv.id)
      setShowNewMessageModal(false)
      return
    }

    const newConv: Conversation = {
      id: Date.now().toString(),
      name: address,
      type: "direct",
      lastMessage: "",
      timestamp: "now",
    }
    mockDirectMessages.push(newConv)
    setActiveConversation(newConv.id)
    setShowNewMessageModal(false)
  }

  const handleDecryptionAuthorize = () => {
    setMessages((prev) =>
      prev.map((m) =>
        m.isEncrypted
          ? {
              ...m,
              isEncrypted: false,
              needsDecryption: false,
              content: m.content, // In real app, this would be decrypted content
            }
          : m,
      ),
    )
    setShowDecryptionModal(false)
  }

  const handleDecryptionDeny = () => {
    setShowDecryptionModal(false)
    setActiveConversation(null)
  }

  const handleLoadMoreMessages = () => {
    console.log("Load more messages")
  }

  const handleVoteToMakePublic = (messageId: string) => {
    setSelectedMessageForVote(messageId)
    setShowVoteModal(true)
  }

  const handleVote = (messageId: string, vote: "for" | "against") => {
    console.log(`Voted ${vote} for message ${messageId}`)
    // In real app, this would call smart contract
  }

  const activeConv = conversationsList.find((c) => c.id === activeConversation)
  const encryptedMessageCount = messages.filter((m) => m.isEncrypted).length
  const selectedMessage = messages.find((m) => m.id === selectedMessageForVote)
  const mockVoteData = selectedMessage
    ? {
        messageId: selectedMessage.id,
        messagePreview: selectedMessage.content,
        sender: selectedMessage.sender,
        timestamp: selectedMessage.timestamp,
        votesFor: 3,
        votesAgainst: 1,
        totalVoters: daoMembers.length,
        quorum: 60,
        deadline: "in 24 hours",
        hasVoted: false,
        voters: [
          { address: "0x742d...3f4a", vote: "for" as const, timestamp: "2h ago" },
          { address: "0x9f3e...2a1b", vote: "for" as const, timestamp: "1h ago" },
          { address: "0x5d8c...4e7f", vote: "against" as const, timestamp: "30m ago" },
        ],
      }
    : null

  const displayMessages = searchQuery.trim() ? searchResults : messages

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold">FHEVM Messenger</span>
          <Badge variant="secondary" className="text-xs">
            Demo Mode
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-mono">{mockAddress}</span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full relative"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center font-medium">
                {unreadNotifications}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowUserSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-border flex flex-col bg-card/30">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant={sidebarTab === "direct" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 rounded-full"
                onClick={() => setSidebarTab("direct")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Direct
              </Button>
              <Button
                variant={sidebarTab === "dao" ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 rounded-full"
                onClick={() => setSidebarTab("dao")}
              >
                <Users className="h-4 w-4 mr-2" />
                DAOs
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-9 bg-background rounded-full" />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-2 pb-4">
              {conversationsList.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation.id)}
                  className={cn(
                    "w-full p-3 rounded-2xl text-left hover:bg-secondary/50 transition-colors mb-1",
                    activeConversation === conversation.id && "bg-secondary",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {conversation.type === "direct" ? (
                      <UserAvatar address={conversation.name} size="md" showOnline isOnline={conversation.id === "1"} />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                        <Hash className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">
                          {conversation.type === "dao" ? "#" : ""}
                          {conversation.name}
                        </span>
                        {conversation.timestamp && (
                          <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                        {conversation.unread && conversation.unread > 0 && (
                          <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <Button
              className="w-full rounded-full"
              size="sm"
              onClick={() => {
                if (sidebarTab === "dao") {
                  setShowCreateDaoModal(true)
                } else {
                  setShowNewMessageModal(true)
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New {sidebarTab === "direct" ? "Message" : "Channel"}
            </Button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {activeConv?.type === "dao" ? (
                <DaoChannelHeader
                  channelName={activeConv.name}
                  memberCount={daoMembers.length}
                  isPublic={false}
                  onMakePublic={handleMakePublic}
                />
              ) : (
                <div className="border-b border-border px-6 py-4 bg-card/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <UserAvatar address={activeConv?.name || ""} size="md" showOnline isOnline />
                    <div className="flex-1">
                      <h2 className="font-semibold">{activeConv?.name}</h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        Online • Encrypted conversation
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => {
                        const searchInput = document.getElementById("message-search") as HTMLInputElement
                        searchInput?.focus()
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="message-search"
                      placeholder="Search in conversation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9 bg-background/50 rounded-full"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {searchQuery && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {isSearching ? (
                        "Searching..."
                      ) : (
                        <>
                          {searchResults.length} {searchResults.length === 1 ? "result" : "results"} found
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <MessageList
                messages={displayMessages}
                currentUser={mockAddress}
                onReply={handleReply}
                onDelete={handleDelete}
                onLoadMore={handleLoadMoreMessages}
                hasMore={false}
                onVoteToMakePublic={activeConv?.type === "dao" ? handleVoteToMakePublic : undefined}
                isInDao={activeConv?.type === "dao"}
              />

              <MessageComposer
                onSend={handleSendMessage}
                quotedMessage={quotedMessage}
                onClearQuote={() => setQuotedMessage(null)}
                placeholder={
                  activeConv?.type === "dao" ? `Message #${activeConv.name}` : "Type an encrypted message..."
                }
              />
            </>
          ) : (
            <EmptyState type="no-conversation" />
          )}
        </main>

        {activeConversation && activeConv?.type === "dao" && showDaoMembers && <DaoMemberList members={daoMembers} />}
      </div>
      <NewMessageModal
        open={showNewMessageModal}
        onOpenChange={setShowNewMessageModal}
        onStartConversation={handleStartConversation}
      />
      <DecryptionAuthModal
        open={showDecryptionModal}
        onOpenChange={setShowDecryptionModal}
        messageCount={encryptedMessageCount}
        senderAddress={activeConv?.name || ""}
        onAuthorize={handleDecryptionAuthorize}
        onDeny={handleDecryptionDeny}
      />
      <CreateDaoModal open={showCreateDaoModal} onOpenChange={setShowCreateDaoModal} onCreateDao={handleCreateDao} />
      <DaoSettingsModal
        open={showDaoSettingsModal}
        onOpenChange={setShowDaoSettingsModal}
        daoName={activeConv?.name || ""}
        daoMembers={daoMembers}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onUpdateRole={handleUpdateRole}
      />
      {mockVoteData && (
        <PublicDisclosureVoteModal
          open={showVoteModal}
          onOpenChange={setShowVoteModal}
          voteData={mockVoteData}
          onVote={handleVote}
        />
      )}
      <UserSettingsModal open={showUserSettings} onOpenChange={setShowUserSettings} userAddress={mockAddress} />
      <NotificationCenter
        open={showNotifications}
        onOpenChange={setShowNotifications}
        onNotificationClick={(notification) => {
          if (notification.conversationId) {
            setActiveConversation(notification.conversationId)
          }
          setUnreadNotifications((prev) => Math.max(0, prev - 1))
        }}
      />
    </div>
  )
}
