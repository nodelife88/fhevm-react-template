"use client"

import { useState } from "react"
import { useContract } from "@/hooks/use-contract"
import { useWeb3 } from "@/lib/web3-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export function ContractDemo() {
  const { address, isConnected } = useWeb3()
  const {
    loading,
    error,
    sendMessageToUser,
    getMessages,
    markAsRead,
    deleteMessageById,
    createNewChannel,
    sendMessageToChannel,
    getChannelMessages,
    clearError,
  } = useContract()

  const [recipient, setRecipient] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [channelName, setChannelName] = useState("")
  const [channelMembers, setChannelMembers] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [channelMessages, setChannelMessages] = useState<any[]>([])

  const handleSendMessage = async () => {
    if (!recipient || !messageContent) return
    
    const messageId = await sendMessageToUser(recipient, messageContent)
    if (messageId) {
      setMessageContent("")
      alert(`Message sent! ID: ${messageId}`)
    }
  }

  const handleGetMessages = async () => {
    if (!recipient) return
    
    const msgs = await getMessages(recipient)
    setMessages(msgs)
  }

  const handleCreateChannel = async () => {
    if (!channelName || !channelMembers) return
    
    const members = channelMembers.split(",").map(m => m.trim())
    const success = await createNewChannel(channelName, members)
    if (success) {
      alert(`Channel "${channelName}" created successfully!`)
      setChannelName("")
      setChannelMembers("")
    }
  }

  const handleSendChannelMessage = async () => {
    if (!channelName || !messageContent) return
    
    const messageId = await sendMessageToChannel(channelName, messageContent)
    if (messageId) {
      setMessageContent("")
      alert(`Channel message sent! ID: ${messageId}`)
    }
  }

  const handleGetChannelMessages = async () => {
    if (!channelName) return
    
    const msgs = await getChannelMessages(channelName)
    setChannelMessages(msgs)
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Contract Demo</CardTitle>
          <CardDescription>Connect your wallet to interact with the ConfidentialMessenger contract</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please connect your wallet to use the contract demo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ConfidentialMessenger Contract Demo</CardTitle>
          <CardDescription>
            Interact with the deployed contract at: 0x663F72147269D638ED869f05C0B4C62008826a6b
          </CardDescription>
          <Badge variant="outline">Connected: {address}</Badge>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={clearError} className="ml-2">
              Clear
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Send Message */}
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription>Send an encrypted message to another user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Recipient address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <Input
              placeholder="Message content"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !recipient || !messageContent}
              className="w-full"
            >
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </CardContent>
        </Card>

        {/* Get Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Get Messages</CardTitle>
            <CardDescription>Retrieve messages from a conversation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Conversation partner address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <Button 
              onClick={handleGetMessages} 
              disabled={loading || !recipient}
              className="w-full"
            >
              {loading ? "Loading..." : "Get Messages"}
            </Button>
            {messages.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Messages ({messages.length}):</h4>
                {messages.map((msg, index) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <div><strong>From:</strong> {msg.sender}</div>
                    <div><strong>Content:</strong> {msg.content}</div>
                    <div><strong>Time:</strong> {new Date(msg.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Channel */}
        <Card>
          <CardHeader>
            <CardTitle>Create Channel</CardTitle>
            <CardDescription>Create a new channel with members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Channel name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
            <Input
              placeholder="Member addresses (comma-separated)"
              value={channelMembers}
              onChange={(e) => setChannelMembers(e.target.value)}
            />
            <Button 
              onClick={handleCreateChannel} 
              disabled={loading || !channelName || !channelMembers}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Channel"}
            </Button>
          </CardContent>
        </Card>

        {/* Send Channel Message */}
        <Card>
          <CardHeader>
            <CardTitle>Send Channel Message</CardTitle>
            <CardDescription>Send a message to a channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Channel name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
            <Input
              placeholder="Message content"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
            <Button 
              onClick={handleSendChannelMessage} 
              disabled={loading || !channelName || !messageContent}
              className="w-full"
            >
              {loading ? "Sending..." : "Send Channel Message"}
            </Button>
          </CardContent>
        </Card>

        {/* Get Channel Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Get Channel Messages</CardTitle>
            <CardDescription>Retrieve messages from a channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Channel name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
            <Button 
              onClick={handleGetChannelMessages} 
              disabled={loading || !channelName}
              className="w-full"
            >
              {loading ? "Loading..." : "Get Channel Messages"}
            </Button>
            {channelMessages.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Channel Messages ({channelMessages.length}):</h4>
                {channelMessages.map((msg, index) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <div><strong>From:</strong> {msg.sender}</div>
                    <div><strong>Content:</strong> {msg.content}</div>
                    <div><strong>Time:</strong> {new Date(msg.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
