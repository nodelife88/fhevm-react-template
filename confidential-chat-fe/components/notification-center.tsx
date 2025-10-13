"use client"

import { useState } from "react"
import { Bell, Check, MessageSquare, Users, Vote, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "./user-avatar"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "message" | "mention" | "vote" | "dao"
  title: string
  description: string
  timestamp: string
  read: boolean
  sender?: string
  conversationId?: string
}

interface NotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotificationClick?: (notification: Notification) => void
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "New message from 0x742d...3f4a",
    description: "Thanks for the update!",
    timestamp: "2m ago",
    read: false,
    sender: "0x742d...3f4a",
    conversationId: "1",
  },
  {
    id: "2",
    type: "vote",
    title: "Vote passed in #governance",
    description: "The proposal to make message public has been approved",
    timestamp: "1h ago",
    read: false,
    conversationId: "dao-2",
  },
  {
    id: "3",
    type: "mention",
    title: "You were mentioned in #general",
    description: "@0x1a2b...5c6d can you review the smart contract?",
    timestamp: "3h ago",
    read: true,
    sender: "0x9f3e...2a1b",
    conversationId: "dao-1",
  },
  {
    id: "4",
    type: "dao",
    title: "New member joined #development",
    description: "0x5d8c...4e7f has joined the channel",
    timestamp: "5h ago",
    read: true,
    conversationId: "dao-3",
  },
  {
    id: "5",
    type: "message",
    title: "New message from 0x9f3e...2a1b",
    description: "Meeting at 3pm?",
    timestamp: "1d ago",
    read: true,
    sender: "0x9f3e...2a1b",
    conversationId: "2",
  },
]

export function NotificationCenter({ open, onOpenChange, onNotificationClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id)
    onNotificationClick?.(notification)
    onOpenChange(false)
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />
      case "mention":
        return <MessageSquare className="h-4 w-4" />
      case "vote":
        return <Vote className="h-4 w-4" />
      case "dao":
        return <Users className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "message":
        return "from-cyan-500/20 to-blue-500/20"
      case "mention":
        return "from-purple-500/20 to-pink-500/20"
      case "vote":
        return "from-green-500/20 to-emerald-500/20"
      case "dao":
        return "from-orange-500/20 to-amber-500/20"
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50">
      <div className="absolute inset-0" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-md h-screen bg-background border-l border-border flex flex-col animate-in slide-in-from-right">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
              <Bell className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} unread</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full p-3 rounded-xl text-left transition-colors group relative",
                      notification.read ? "hover:bg-secondary/50" : "bg-secondary/30 hover:bg-secondary/50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br flex-shrink-0",
                          getNotificationColor(notification.type),
                        )}
                      >
                        {notification.sender ? (
                          <UserAvatar address={notification.sender} size="sm" />
                        ) : (
                          getNotificationIcon(notification.type)
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium line-clamp-1">{notification.title}</p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-cyan-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{notification.description}</p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
