"use client"

import { useState } from "react"
import { X, UserPlus, Trash2, Shield, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "./user-avatar"

interface DaoMember {
  address: string
  role: "admin" | "member"
  joinedAt: string
}

interface DaoSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  daoName: string
  daoMembers: DaoMember[]
  onAddMember: (address: string, role: "admin" | "member") => void
  onRemoveMember: (address: string) => void
  onUpdateRole: (address: string, role: "admin" | "member") => void
}

export function DaoSettingsModal({
  open,
  onOpenChange,
  daoName,
  daoMembers,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
}: DaoSettingsModalProps) {
  const [newMemberAddress, setNewMemberAddress] = useState("")
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member")

  const handleAddMember = () => {
    if (newMemberAddress.trim()) {
      onAddMember(newMemberAddress, newMemberRole)
      setNewMemberAddress("")
      setNewMemberRole("member")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">DAO Settings</h2>
            <p className="text-sm text-white/60">{daoName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Add Member */}
          <div className="space-y-3">
            <Label className="text-white/80">Add New Member</Label>
            <div className="flex gap-2">
              <Input
                placeholder="0x... wallet address"
                value={newMemberAddress}
                onChange={(e) => setNewMemberAddress(e.target.value)}
                className="flex-1 border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as "admin" | "member")}
                className="rounded-lg border border-white/10 bg-white/5 px-3 text-white"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                onClick={handleAddMember}
                disabled={!newMemberAddress.trim()}
                className="bg-cyan-500 text-white hover:bg-cyan-600"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            <Label className="text-white/80">Members ({daoMembers.length})</Label>
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {daoMembers.map((member) => (
                <div
                  key={member.address}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar address={member.address} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm text-white">
                          {member.address.slice(0, 6)}...
                          {member.address.slice(-4)}
                        </p>
                        {member.role === "admin" && <Crown className="h-3 w-3 text-yellow-400" />}
                      </div>
                      <p className="text-xs text-white/40">Joined {member.joinedAt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateRole(member.address, member.role === "admin" ? "member" : "admin")}
                      className="h-8 text-xs text-white/60 hover:text-white"
                    >
                      {member.role === "admin" ? (
                        <>
                          <Shield className="mr-1 h-3 w-3" />
                          Demote
                        </>
                      ) : (
                        <>
                          <Crown className="mr-1 h-3 w-3" />
                          Promote
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveMember(member.address)}
                      className="h-8 w-8 text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
