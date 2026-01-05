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
    if (!groupName.trim() || selectedMembers.length < 2) return

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
    } finally {
      setIsCreating(false)
    }
  }

  const selectedProfiles = profiles.filter(p => selectedMembers.includes(p.wallet))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Create New Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-1">
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full text-sm"
            />
          </div>

          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Members ({selectedMembers.length})</Label>
              <div className="flex flex-wrap gap-1.5">
                {selectedProfiles.map((member) => (
                  <div
                    key={member.wallet}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs max-w-full"
                  >
                    <Avatar name={member.name} src={member.avatarUrl} size={20} />
                    <span className="truncate max-w-[80px]">{member.name}</span>
                    <button
                      onClick={() => handleMemberToggle(member.wallet)}
                      className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              {selectedMembers.length < 2 && (
                <p className="text-xs text-amber-600">
                  Minimum 2 members required to create a group
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Add Members</Label>
            {selectedMembers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select at least 2 members to create a group
              </p>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="pl-10 text-sm"
              />
            </div>

            {searchQuery && (
              <div className="max-h-40 sm:max-h-48 overflow-y-auto border rounded-lg">
                {filteredProfiles.map((user) => (
                  <div
                    key={user.wallet}
                    onClick={() => handleMemberToggle(user.wallet)}
                    className={`flex items-center gap-2 p-2 sm:p-3 hover:bg-secondary/50 cursor-pointer transition-colors ${
                      selectedMembers.includes(user.wallet) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Avatar name={user.name} src={user.avatarUrl} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.wallet}</p>
                    </div>
                    {selectedMembers.includes(user.wallet) && (
                      <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                    )}
                  </div>
                ))}
                {filteredProfiles.length === 0 && (
                  <div className="p-2 sm:p-3 text-center text-muted-foreground text-sm">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length < 2 || isCreating}
              className="flex-1 text-sm"
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
