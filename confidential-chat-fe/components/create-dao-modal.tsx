"use client"

import { useState } from "react"
import { X, Plus, Trash2, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateDaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateDao: (dao: {
    name: string
    description: string
    members: { address: string; role: string }[]
    isPublic: boolean
  }) => void
}

export function CreateDaoModal({ open, onOpenChange, onCreateDao }: CreateDaoModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [members, setMembers] = useState<{ address: string; role: string }[]>([{ address: "", role: "member" }])
  const [isCreating, setIsCreating] = useState(false)

  const addMember = () => {
    setMembers([...members, { address: "", role: "member" }])
  }

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const updateMember = (index: number, field: "address" | "role", value: string) => {
    const updated = [...members]
    updated[index][field] = value
    setMembers(updated)
  }

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsCreating(true)
    // Simulate creation delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    onCreateDao({
      name,
      description,
      members: members.filter((m) => m.address.trim()),
      isPublic,
    })

    // Reset form
    setName("")
    setDescription("")
    setMembers([{ address: "", role: "member" }])
    setIsPublic(false)
    setIsCreating(false)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create New DAO Channel</h2>
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
          {/* DAO Name */}
          <div className="space-y-2">
            <Label htmlFor="dao-name" className="text-white/80">
              DAO Name
            </Label>
            <Input
              id="dao-name"
              placeholder="e.g., Core Team, Marketing DAO"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="dao-description" className="text-white/80">
              Description (Optional)
            </Label>
            <Textarea
              id="dao-description"
              placeholder="What is this DAO for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>

          {/* Privacy Setting */}
          <div className="space-y-2">
            <Label className="text-white/80">Privacy</Label>
            <Select value={isPublic ? "public" : "private"} onValueChange={(value) => setIsPublic(value === "public")}>
              <SelectTrigger className="border-white/10 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-cyan-400" />
                    <span>Private - Encrypted messages</span>
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-white/60" />
                    <span>Public - Anyone can read</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white/80">Members</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addMember}
                className="h-8 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Member
              </Button>
            </div>

            <div className="max-h-[240px] space-y-2 overflow-y-auto">
              {members.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="0x... wallet address"
                    value={member.address}
                    onChange={(e) => updateMember(index, "address", e.target.value)}
                    className="flex-1 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                  />
                  <Select value={member.role} onValueChange={(value) => updateMember(index, "role", value)}>
                    <SelectTrigger className="w-[140px] border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  {members.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(index)}
                      className="text-white/40 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
            >
              {isCreating ? "Creating..." : "Create DAO"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
