"use client"

import { useState } from "react"
import { X, User, Bell, Shield, Key, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "./user-avatar"

interface UserSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userAddress: string
}

export function UserSettingsModal({ open, onOpenChange, userAddress }: UserSettingsModalProps) {
  const [displayName, setDisplayName] = useState("")
  const [showReadReceipts, setShowReadReceipts] = useState(true)
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [notifyNewMessages, setNotifyNewMessages] = useState(true)
  const [notifyMentions, setNotifyMentions] = useState(true)
  const [notifyVotes, setNotifyVotes] = useState(true)
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
              <User className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
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

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-white/10">
              <UserAvatar address={userAddress} size="lg" />
              <div className="text-center">
                <p className="font-mono text-sm text-white">{userAddress}</p>
                <p className="text-xs text-white/60 mt-1">Your wallet address</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name" className="text-white/80">
                  Display Name (Optional)
                </Label>
                <Input
                  id="display-name"
                  placeholder="Enter a display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                />
                <p className="text-xs text-white/60">This will be shown instead of your wallet address</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-cyan-400" />
                    <Label htmlFor="read-receipts" className="text-white font-medium">
                      Read Receipts
                    </Label>
                  </div>
                  <p className="text-sm text-white/60">Let others know when you've read their messages</p>
                </div>
                <Switch id="read-receipts" checked={showReadReceipts} onCheckedChange={setShowReadReceipts} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-cyan-400" />
                    <Label htmlFor="online-status" className="text-white font-medium">
                      Online Status
                    </Label>
                  </div>
                  <p className="text-sm text-white/60">Show when you're online and active</p>
                </div>
                <Switch id="online-status" checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} />
              </div>

              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-cyan-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white mb-1">End-to-End Encryption</p>
                    <p className="text-xs text-white/60">
                      All your messages are encrypted with FHEVM. Only you and the recipient can read them.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4 text-cyan-400" />
                    <Label htmlFor="notify-messages" className="text-white font-medium">
                      New Messages
                    </Label>
                  </div>
                  <p className="text-sm text-white/60">Get notified when you receive new messages</p>
                </div>
                <Switch id="notify-messages" checked={notifyNewMessages} onCheckedChange={setNotifyNewMessages} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4 text-cyan-400" />
                    <Label htmlFor="notify-mentions" className="text-white font-medium">
                      Mentions
                    </Label>
                  </div>
                  <p className="text-sm text-white/60">Get notified when someone mentions you in a DAO</p>
                </div>
                <Switch id="notify-mentions" checked={notifyMentions} onCheckedChange={setNotifyMentions} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="h-4 w-4 text-cyan-400" />
                    <Label htmlFor="notify-votes" className="text-white font-medium">
                      Voting Activity
                    </Label>
                  </div>
                  <p className="text-sm text-white/60">Get notified about new votes and voting results</p>
                </div>
                <Switch id="notify-votes" checked={notifyVotes} onCheckedChange={setNotifyVotes} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-4 w-4 text-cyan-400" />
                    <Label className="text-white font-medium">Encryption Keys</Label>
                  </div>
                  <p className="text-sm text-white/60">Your FHEVM encryption keys are managed by your wallet</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Public Key</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan-400 hover:text-cyan-300">
                      Copy
                    </Button>
                  </div>
                  <div className="rounded border border-white/10 bg-black/50 p-2">
                    <p className="font-mono text-xs text-white/80 break-all">0x04a8f3c2...7d9e1b4f</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-cyan-400" />
                    <Label className="text-white font-medium">Private Key</Label>
                  </div>
                  <p className="text-sm text-white/60">Never share your private key with anyone</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Private Key</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="h-7 text-xs text-white/60 hover:text-white"
                    >
                      {showPrivateKey ? (
                        <>
                          <EyeOff className="mr-1 h-3 w-3" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1 h-3 w-3" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded border border-white/10 bg-black/50 p-2">
                    <p className="font-mono text-xs text-white/80 break-all">
                      {showPrivateKey ? "0x3f7a9c2d...8e4b1f6a" : "••••••••••••••••••••"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Security Warning</p>
                    <p className="text-xs text-white/60">
                      Your private keys are stored securely in your wallet. Never share them with anyone or enter them
                      on untrusted websites.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-6 border-t border-white/10 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
