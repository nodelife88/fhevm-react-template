"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/user-avatar"
import { Search, Send, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecentContact {
  address: string
  lastMessageTime: string
}

interface NewMessageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartConversation: (address: string) => void
}

export function NewMessageModal({ open, onOpenChange, onStartConversation }: NewMessageModalProps) {
  const [recipientAddress, setRecipientAddress] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Mock recent contacts
  const recentContacts: RecentContact[] = [
    { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f3f4a", lastMessageTime: "2 hours ago" },
    { address: "0x8b3c9d2e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c", lastMessageTime: "1 day ago" },
    { address: "0x1a5f7c8b9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a", lastMessageTime: "3 days ago" },
    { address: "0x9f3e2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f", lastMessageTime: "1 week ago" },
  ]

  const filteredContacts = recentContacts.filter((contact) =>
    contact.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const handleStartConversation = () => {
    if (isValidAddress(recipientAddress)) {
      onStartConversation(recipientAddress)
      setRecipientAddress("")
      setSearchQuery("")
      onOpenChange(false)
    }
  }

  const handleSelectContact = (address: string) => {
    onStartConversation(address)
    setRecipientAddress("")
    setSearchQuery("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>Start a new encrypted conversation with any wallet address</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Address Input */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <div className="flex gap-2">
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className={cn(
                  "flex-1",
                  recipientAddress &&
                    !isValidAddress(recipientAddress) &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              <Button
                onClick={handleStartConversation}
                disabled={!isValidAddress(recipientAddress)}
                size="icon"
                className="rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {recipientAddress && !isValidAddress(recipientAddress) && (
              <p className="text-sm text-destructive">Please enter a valid Ethereum address</p>
            )}
          </div>

          {/* Recent Contacts */}
          <div className="space-y-2">
            <Label>Recent Contacts</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[240px] rounded-xl border border-border bg-card/30 p-2">
              {filteredContacts.length > 0 ? (
                <div className="space-y-1">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.address}
                      onClick={() => handleSelectContact(contact.address)}
                      className="w-full p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar address={contact.address} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{contact.address}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {contact.lastMessageTime}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No contacts found" : "No recent contacts"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enter a wallet address above to start a conversation
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
