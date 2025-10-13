"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Hash, Users, Settings, Eye, EyeOff, MoreVertical } from "lucide-react"

interface DaoChannelHeaderProps {
  channelName: string
  memberCount: number
  isPublic?: boolean
  onMakePublic?: () => void
  onSettings?: () => void
}

export function DaoChannelHeader({
  channelName,
  memberCount,
  isPublic = false,
  onMakePublic,
  onSettings,
}: DaoChannelHeaderProps) {
  return (
    <div className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">#{channelName}</h2>
              {isPublic ? (
                <Badge variant="outline" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="default" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{memberCount} members</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Channel Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="h-4 w-4 mr-2" />
              View Members
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!isPublic && onMakePublic && (
              <DropdownMenuItem onClick={onMakePublic}>
                <Eye className="h-4 w-4 mr-2" />
                Make Public (Requires Vote)
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
