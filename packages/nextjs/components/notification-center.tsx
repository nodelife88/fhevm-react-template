"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bell, X, Check, Clock, MessageSquare, Users, Hash } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "message" | "vote" | "mention" | "dao"
  title: string
  description: string
  timestamp: string
  read: boolean
  sender?: string
  conversationId?: string
  daoId?: string
}

interface NotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotificationClick?: (notification: Notification) => void
}

// Real notifications will be fetched from contract events
const initialNotifications: Notification[] = []

export function NotificationCenter({ open, onOpenChange, onNotificationClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />
      case "vote":
        return <Users className="h-4 w-4" />
      case "mention":
        return <Hash className="h-4 w-4" />
      case "dao":
        return <Users className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll see contract events here</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    notification.read
                      ? "bg-muted/30 hover:bg-muted/50"
                      : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  )}
                  onClick={() => {
                    onNotificationClick?.(notification)
                    handleMarkAsRead(notification.id)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.description}</p>
                      {!notification.read && (
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark as read
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}