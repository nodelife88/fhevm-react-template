"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Crown } from "lucide-react"

interface DaoMember {
  address: string
  role: "admin" | "member"
  joinedAt: string
}

interface DaoMemberListProps {
  members: DaoMember[]
}

export function DaoMemberList({ members }: DaoMemberListProps) {
  return (
    <div className="w-64 border-l border-border bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Members ({members.length})</h3>
      </div>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-2 space-y-1">
          {members.map((member) => (
            <div
              key={member.address}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono">
                  {member.address.slice(0, 4)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-mono truncate">{member.address}</span>
                  {member.role === "admin" && <Crown className="h-3 w-3 text-primary flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
