"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/lib/web3-context"
import { useContract } from "@/hooks/use-contract"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { isValidAddress, normalizeAddress } from "@/lib/utils"
import { SUPPORTED_CHAIN_ID } from "@/lib/config"

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

// Real conversations will be fetched from contract
const initialDirectMessages: Conversation[] = []

// Real messages will be fetched from contract
const initialMessages: Record<string, Message[]> = {
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
  const { address, isConnected, chainId, connect, disconnect } = useWeb3()
  const { 
    sendMessageToUser, 
    sendMessageToChannel, 
    getMessages, 
    getChannelMessages,
    createNewChannel,
    listConversations,
    loading,
    error 
  } = useContract()
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
  const [daoMembers, setDaoMembers] = useState<{ address: string; role: "admin" | "member"; joinedAt: string }[]>([])
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [selectedMessageForVote, setSelectedMessageForVote] = useState<string | null>(null)
  const [showUserSettings, setShowUserSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(2)

  // Real conversations from contract
  const [conversations, setConversations] = useState<Conversation[]>([])
  const conversationsList = sidebarTab === "direct" ? conversations : daoChannels
  const activeConv = conversationsList.find((c) => c.id === activeConversation)

  const isWrongChain = typeof chainId === "number" && chainId !== SUPPORTED_CHAIN_ID

  const handleSwitchNetwork = async () => {
    try {
      // 11155111 (Sepolia) -> 0xaa36a7
      await (window as any).ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      })
    } catch (e: any) {
      // If the chain is not added, try adding it
      if (e?.code === 4902) {
        try {
          await (window as any).ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          })
        } catch {}
      }
    }
  }

  // Fetch real conversations when connected
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (isConnected && address) {
        try {
          const convs = await listConversations()
          if (!cancelled) {
            const mapped = convs.map((c) => ({ id: c.id || c.name, name: c.name, type: "direct" as const }))
            setConversations(mapped)
            if (!activeConversation && mapped.length > 0) {
              setActiveConversation(mapped[0].id)
            }
          }
        } catch (e) {
          if (!cancelled) setConversations([])
        }
      } else {
        if (!cancelled) setConversations([])
      }
    }
    run()
    return () => { cancelled = true }
  }, [isConnected, address])

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
    if (activeConversation && isConnected) {
      // Fetch real messages from contract
      const fetchMessages = async () => {
        try {
          if (activeConv?.type === "direct") {
            const realMessages = await getMessages(activeConv.name)
            const mapped = realMessages.map((m) => ({
              id: m.id,
              content: m.content,
              sender: m.sender,
              timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isOwn: m.sender?.toLowerCase() === address?.toLowerCase(),
              isRead: m.isRead,
              isEncrypted: m.isEncrypted,
            }))
            setMessages(mapped)
          } else {
            const realMessages = await getChannelMessages(activeConv?.name || "")
            const mapped = realMessages.map((m) => ({
              id: m.id,
              content: m.content,
              sender: m.sender,
              timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isOwn: m.sender?.toLowerCase() === address?.toLowerCase(),
              isRead: m.isRead,
              isEncrypted: m.isEncrypted,
            }))
            setMessages(mapped)
          }
        } catch (error) {
          console.error("Failed to fetch messages:", error)
          // Fallback to initial data
          const conversationMessages = initialMessages[activeConversation] || []
          setMessages(conversationMessages)
        }
      }
      
      fetchMessages()
      setSearchQuery("")
      setSearchResults([])

      if (!hasCheckedDecryption[activeConversation]) {
        const conversationMessages = initialMessages[activeConversation] || []
        const encryptedMessages = conversationMessages.filter((m) => m.isEncrypted)
        if (encryptedMessages.length > 0) {
          setShowDecryptionModal(true)
        }
        setHasCheckedDecryption((prev) => ({ ...prev, [activeConversation]: true }))
      }
    }
  }, [activeConversation, hasCheckedDecryption, isConnected, activeConv, getMessages, getChannelMessages])

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

  const handleSendMessage = async (content: string, quotedMessageId?: string) => {
    if (!isConnected || !address) return

    try {
      console.log("[UI] handleSendMessage", {
        isConnected,
        address,
        activeConvType: activeConv?.type,
        activeConvName: activeConv?.name,
      })

      if (!activeConv) {
        console.warn("[UI] no active conversation; opening New Message modal")
        setShowNewMessageModal(true)
        return
      }

      // Optimistic add
      const tempId = Date.now().toString()
      const optimistic: Message = {
        id: tempId,
        content,
        sender: address,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isOwn: true,
        isRead: false,
        isEncrypted: true,
        quotedMessage: quotedMessageId
          ? (() => {
              const quoted = messages.find((m) => m.id === quotedMessageId)
              return quoted ? { sender: quoted.sender, content: quoted.content } : undefined
            })()
          : undefined,
      }
      setMessages((prev) => [...prev, optimistic])

      // Send and reconcile ID
      let onchainId: string | null = null
      if (activeConv.type === "dao") {
        console.log("[UI] sending to channel via sendMessageToChannel", { channel: activeConv.name })
        onchainId = await sendMessageToChannel(activeConv.name, content)
      } else {
        console.log("[UI] sending direct via sendMessageToUser", { recipient: activeConv.name })
        onchainId = await sendMessageToUser(activeConv.name, content)
      }

      if (onchainId) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: onchainId! } : m)))
      }
      setQuotedMessage(null)
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleCreateDao = async (dao: {
    name: string
    description: string
    members: { address: string; role: string }[]
    isPublic: boolean
  }) => {
    if (!isConnected) return

    try {
      await createNewChannel(dao.name, dao.members.map(m => m.address))
      
      const newDao: Conversation = {
        id: `dao-${Date.now()}`,
        name: dao.name,
        type: "dao",
        lastMessage: "Channel created",
        timestamp: "now",
      }
      setDaoChannels((prev) => [...prev, newDao])
      setActiveConversation(newDao.id)
    } catch (error) {
      console.error("Failed to create DAO:", error)
    }
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

    if (!isValidAddress(address)) {
      console.warn("[UI] invalid address for new conversation", address)
      return
    }
    const normalized = normalizeAddress(address)
    const existingConv = conversations.find((conv) => conv.name.toLowerCase() === normalized.toLowerCase())
    if (existingConv) {
      setActiveConversation(existingConv.id)
      setShowNewMessageModal(false)
      return
    }

    const newConv: Conversation = {
      id: Date.now().toString(),
      name: normalized,
      type: "direct",
      lastMessage: "",
      timestamp: "now",
    }
    setConversations((prev) => [...prev, newConv])
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

  const handleLoadMoreMessages = async () => {
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

  const encryptedMessageCount = messages.filter((m) => m.isEncrypted).length
  const selectedMessage = messages.find((m) => m.id === selectedMessageForVote)
  const voteData = selectedMessage
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
        voters: [],
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
          <Badge variant="default" className="text-xs">
            FHEVM Enabled
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              {isWrongChain && (
                <Button size="sm" variant="destructive" onClick={handleSwitchNetwork}>
                  Switch to Sepolia
                </Button>
              )}
              <span className="text-sm text-muted-foreground font-mono truncate max-w-[160px]">
                {address}
              </span>
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
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                type="button"
                aria-label="Log out"
                title="Log out"
                onClick={() => {
                  disconnect()
                  setActiveConversation(null)
                  setMessages([])
                  setShowUserSettings(false)
                  setShowNotifications(false)
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => connect("metamask")}>Connect Wallet</Button>
          )}
        </div>
      </header>

      {error && (
        <div className="px-4 py-2">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {loading && (
        <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
      )}

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
                  key={conversation.id || conversation.name}
                  onClick={() => setActiveConversation(conversation.id || conversation.name)}
                  className={cn(
                    "w-full p-3 rounded-2xl text-left hover:bg-secondary/50 transition-colors mb-1",
                    activeConversation === (conversation.id || conversation.name) && "bg-secondary",
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
                        {conversation.lastMessage ? (
                          <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                        ) : (
                          <span className="text-xs text-muted-foreground">Encrypted conversation</span>
                        )}
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
                currentUser={address || "0x0000000000000000000000000000000000000000"}
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
                disabled={isWrongChain}
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
      {voteData && (
        <PublicDisclosureVoteModal
          open={showVoteModal}
          onOpenChange={setShowVoteModal}
          voteData={voteData}
          onVote={handleVote}
        />
      )}
      <UserSettingsModal open={showUserSettings} onOpenChange={setShowUserSettings} userAddress={address || "0x0000000000000000000000000000000000000000"} />
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
