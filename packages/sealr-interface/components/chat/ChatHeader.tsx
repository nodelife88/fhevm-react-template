"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import { Search, LogOut, User, Wallet, Users, Plus, Settings } from "lucide-react"
import Image from "next/image"
import { useDisconnect } from "wagmi"

import Avatar from "@/components/shared/Avatar"
import Conversation from "@/components/shared/Conversation"
import CreateGroupModal from "@/components/chat/CreateGroupModal"
import EditProfileModal from "@/components/shared/EditProfileModal"
import { useFHESealrLoginStore } from "@/store/useFHESealrLoginStore"
import { useRainbowKitEthersSigner } from "@/hooks/useRainbowKitEthersSigner"
import { useFHESealrConversationStore } from "@/store/useFHESealrConversationStore"
import { Button } from "@/components/ui/button"

import type { UserProfile, Conversation as ConversationType } from "@/types"

const ChatHeader: React.FC = () => {
  const [query, setQuery] = useState<string>("")
  const [debouncedQuery, setDebouncedQuery] = useState<string>("")
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [balance, setBalance] = useState<string>("")
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState<boolean>(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { push } = useRouter()
  const { disconnect } = useDisconnect()
  const { address, ethersSigner } = useRainbowKitEthersSigner()
  const { profile, profiles, getProfiles } = useFHESealrLoginStore()
  const { conversations, addConversation, setActiveConversation, setActiveMessages, getOrCreateDirectConversation } = useFHESealrConversationStore()

  useEffect(() => {
    const getBalance = async () => {
      const balance = await ethersSigner?.provider.getBalance(address ?? "")
      setBalance(balance ? ethers?.formatEther(balance).slice(0, 5) : "0")
    }
    getBalance()
  }, [ethersSigner])

  useEffect(() => {
    if (address) {
      getProfiles()
    }
  }, [address, getProfiles])

  function checkConversationExists(conversations: ConversationType[], wallet: string): ConversationType | undefined {
    return conversations.find(
      (c) => c.sender?.toLowerCase() === wallet.toLowerCase() || c.receiver?.toLowerCase() === wallet.toLowerCase(),
    )
  }

  async function handleAddFriend(userProfile: UserProfile): Promise<void> {
    try {
      const conversationId = await getOrCreateDirectConversation(userProfile.wallet);
      
      const convo: ConversationType = {
        id: conversationId,
        receiverName: userProfile.name,
        info: userProfile.wallet,
        sender: address,
        receiver: userProfile.wallet,
        createdAt: Date.now(),
        status: 1,
        ctype: 0, // Direct conversation
        members: [address || "", userProfile.wallet] // 2 members for direct chat
      }

      const existingConvo = checkConversationExists(conversations, userProfile.wallet);
      if (!existingConvo) {
        addConversation(convo);
      } else {
        convo.id = existingConvo.id;
      }

      setActiveConversation(convo);
      setActiveMessages([]);
      setQuery("");
      setIsFocused(false);
    } catch (error) {
      console.error("Error creating direct conversation:", error);
      const convo: ConversationType = {
        id: 0,
        receiverName: userProfile.name,
        info: userProfile.wallet,
        sender: address,
        receiver: userProfile.wallet,
        createdAt: Date.now(),
        status: 1,
      }

      if (checkConversationExists(conversations, userProfile.wallet)) {
        const existingConvo = checkConversationExists(conversations, userProfile.wallet) as ConversationType;
        setActiveConversation(existingConvo);
      } else {
        addConversation(convo);
        setActiveConversation(convo);
      }
      setActiveMessages([]);
      setQuery("");
      setIsFocused(false);
    }
  }

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(q)
    }, 150) // 150ms debounce delay
  }, [])

  const onLogout = async (): Promise<void> => {
    try {
      await disconnect();
      push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      push("/");
    }
  };

  useEffect(() => {
    if (!address) push("/")
  }, [address, push])

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const filtered = debouncedQuery
    ? profiles.filter((user) => {
        const isNotCurrentUser = user.wallet.toLowerCase() !== profile?.wallet.toLowerCase()
        const nameMatchesQuery = user.name.toLowerCase().includes(debouncedQuery.toLowerCase())
        const walletMatchesQuery = user.wallet.toLowerCase().includes(debouncedQuery.toLowerCase())

        const matchesQuery = nameMatchesQuery || walletMatchesQuery

        return isNotCurrentUser && matchesQuery
      })
    : []

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <Image src="/sealr.svg" alt="Sealr" width={24} height={24} priority />
        <span className="font-mono text-xl font-semibold">Sealr</span>
      </div>

      <div className="flex-1 max-w-xl mx-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onFocus={() => {
                setIsFocused(true)
                if (profiles.length === 0) {
                  getProfiles()
                }
              }}
              onBlur={() => setTimeout(() => setIsFocused(false), 300)}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users by name or address..."
              className="w-full h-10 pl-10 pr-4 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />

            {isFocused && filtered.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {filtered.map((userProfile) => (
                    <div
                      key={userProfile.id}
                      onClick={() => handleAddFriend(userProfile)}
                      className="hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <Conversation name={userProfile.name} info={userProfile.wallet}>
                        <Avatar name={userProfile.name} src={userProfile.avatarUrl} />
                      </Conversation>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button
            onClick={() => setIsCreateGroupOpen(true)}
            size="sm"
            className="h-10 px-3"
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      <div className="relative group">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-border hover:ring-primary transition-all">
            <Avatar name={profile?.name ?? ""} src={profile?.avatarUrl} />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-medium">{profile?.name}</span>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        <div className="hidden group-hover:block absolute right-0 mt-3 w-72 rounded-lg border border-border bg-card shadow-lg z-50">
          <div className="absolute -top-2 right-4 h-2 w-full bg-transparent" />

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="h-12 w-12 rounded-full overflow-hidden">
                <Avatar name={profile?.name ?? ""} src={profile?.avatarUrl} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{profile?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.wallet}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Username:</span>
                <span className="font-medium ml-auto">{profile?.name}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-medium text-primary ml-auto">{balance} ETH</span>
              </div>
            </div>

            <Button
              onClick={() => setIsEditProfileOpen(true)}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>

            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </div>

      <CreateGroupModal 
        isOpen={isCreateGroupOpen} 
        onClose={() => setIsCreateGroupOpen(false)} 
      />
      
      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
      />
    </header>
  )
}

export default ChatHeader
