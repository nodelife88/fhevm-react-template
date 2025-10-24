"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Users, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Avatar from "@/components/shared/Avatar"
import { useFHESealrLoginStore } from "@/store/useFHESealrLoginStore"
import { useFHESealrConversationStore } from "@/store/useFHESealrConversationStore"
import { useRainbowKitEthersSigner } from "@/hooks/useRainbowKitEthersSigner"
import type { UserProfile } from "@/types"

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const { address } = useRainbowKitEthersSigner()
  const { profiles, getProfiles } = useFHESealrLoginStore()
  const { createGroup, fetchConversations } = useFHESealrConversationStore()

  useEffect(() => {
    if (isOpen) {
      getProfiles()
    }
  }, [isOpen, getProfiles])

  const filteredProfiles = profiles.filter((user) => {
    const isNotCurrentUser = user.wallet.toLowerCase() !== address?.toLowerCase()
    const matchesQuery = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.wallet.toLowerCase().includes(searchQuery.toLowerCase())
    return isNotCurrentUser && matchesQuery
  })

  const handleMemberToggle = (wallet: string) => {
    setSelectedMembers(prev => 
      prev.includes(wallet) 
        ? prev.filter(w => w !== wallet)
        : [...prev, wallet]
    )
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return

    setIsCreating(true)
    try {
      const success = await createGroup(groupName.trim(), selectedMembers)
      if (success) {
        await fetchConversations()
        setGroupName("")
        setSelectedMembers([])
        setSearchQuery("")
        onClose()
      }
    } catch (error) {
      console.error("Failed to create group:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const selectedProfiles = profiles.filter(p => selectedMembers.includes(p.wallet))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name Input */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full"
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Members ({selectedMembers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedProfiles.map((member) => (
                  <div
                    key={member.wallet}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    <Avatar name={member.name} size="sm" />
                    <span>{member.name}</span>
                    <button
                      onClick={() => handleMemberToggle(member.wallet)}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Members */}
          <div className="space-y-2">
            <Label>Add Members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="pl-10"
              />
            </div>

            {/* Member List */}
            {searchQuery && (
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {filteredProfiles.map((user) => (
                  <div
                    key={user.wallet}
                    onClick={() => handleMemberToggle(user.wallet)}
                    className={`flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer transition-colors ${
                      selectedMembers.includes(user.wallet) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Avatar name={user.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.wallet}</p>
                    </div>
                    {selectedMembers.includes(user.wallet) && (
                      <div className="h-2 w-2 bg-primary rounded-full" />
                    )}
                  </div>
                ))}
                {filteredProfiles.length === 0 && (
                  <div className="p-3 text-center text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Create Button */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0 || isCreating}
              className="flex-1"
            >
              {isCreating ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateGroupModal
