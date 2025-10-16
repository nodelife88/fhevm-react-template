"use client"

import { useState, useEffect, useCallback } from "react"
import { useWeb3 } from "@/lib/web3-context"
import {
  fetchMessages,
  sendMessage as sendMessageToChain,
  requestDecryption,
  markMessageAsRead,
  deleteMessage as deleteMessageOnChain,
  type Message,
  type Conversation,
} from "@/lib/fhevm-contract"

export function useMessages(conversationWith: string | null) {
  const { address, isConnected } = useWeb3()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const LIMIT = 20

  // Fetch messages from blockchain
  const loadMessages = useCallback(
    async (reset = false) => {
      if (!conversationWith || !isConnected || !address) return

      setIsLoading(true)
      try {
        const currentOffset = reset ? 0 : offset
        const newMessages = await fetchMessages(conversationWith, currentOffset, LIMIT, window.ethereum)

        if (newMessages.length < LIMIT) {
          setHasMore(false)
        }

        setMessages((prev) => (reset ? newMessages : [...newMessages, ...prev]))
        setOffset(currentOffset + newMessages.length)
      } catch (error) {
        console.error("[v0] Error loading messages:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [conversationWith, isConnected, address, offset],
  )

  // Load initial messages when conversation changes
  useEffect(() => {
    if (conversationWith) {
      setMessages([])
      setOffset(0)
      setHasMore(true)
      loadMessages(true)
    }
  }, [conversationWith])

  // Send a new message
  const sendMessage = async (content: string, quotedMessageId?: string) => {
    if (!conversationWith || !address) return

    try {
      const messageId = await sendMessageToChain(conversationWith, content, window.ethereum, address)

      // Optimistically add message to UI
      const newMessage: Message = {
        id: messageId,
        sender: address,
        recipient: conversationWith,
        content,
        timestamp: Date.now(),
        isRead: false,
        isDeleted: false,
        isEncrypted: false, // Just sent, so we have plaintext
      }

      setMessages((prev) => [...prev, newMessage])
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      throw error
    }
  }

  // Decrypt messages
  const decryptMessages = async (messageIds: string[]) => {
    if (!address) return

    try {
      const decryptedContents = await requestDecryption(messageIds, window.ethereum, address)

      // Update messages with decrypted content
      setMessages((prev) =>
        prev.map((msg) => {
          const index = messageIds.indexOf(msg.id)
          if (index !== -1) {
            return {
              ...msg,
              content: decryptedContents[index],
              isEncrypted: false,
            }
          }
          return msg
        }),
      )
    } catch (error) {
      console.error("[v0] Error decrypting messages:", error)
      throw error
    }
  }

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    if (!address) return

    try {
      await markMessageAsRead(messageId, window.ethereum, address)
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg)))
    } catch (error) {
      console.error("[v0] Error marking as read:", error)
    }
  }

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!address) return

    try {
      await deleteMessageOnChain(messageId, window.ethereum, address)
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, isDeleted: true } : msg)))
    } catch (error) {
      console.error("[v0] Error deleting message:", error)
      throw error
    }
  }

  return {
    messages,
    isLoading,
    hasMore,
    loadMore: () => loadMessages(false),
    sendMessage,
    decryptMessages,
    markAsRead,
    deleteMessage,
  }
}

// Hook for managing conversations list
export function useConversations() {
  const { address, isConnected } = useWeb3()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isConnected && address) {
      loadConversations()
    }
  }, [isConnected, address])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      // In real implementation, fetch from blockchain or indexer
      // For now, return empty array - will be populated as messages are sent/received
      setConversations([])
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    conversations,
    isLoading,
    refresh: loadConversations,
  }
}
