"use client"

import { useState, useCallback } from "react"
import { useWeb3 } from "@/lib/web3-context"
import { ethers } from "ethers"
import {
  sendMessage,
  fetchMessages,
  markMessageAsRead,
  deleteMessage,
  createChannel,
  sendChannelMessage,
  fetchChannelMessages,
  decryptWithFHEVM,
  type Message,
} from "@/lib/fhevm-contract"

export function useContract() {
  const { address, isConnected } = useWeb3()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((err: any) => {
    console.error("Contract error:", err)
    setError(err.message || "An error occurred")
    setLoading(false)
  }, [])

  const sendMessageToUser = useCallback(async (recipient: string, content: string): Promise<string | null> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Get ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      const messageId = await sendMessage(recipient, content, signer)
      setLoading(false)
      return messageId
    } catch (err) {
      handleError(err)
      return null
    }
  }, [isConnected, address, handleError])

  const getMessages = useCallback(async (conversationWith: string, offset = 0, limit = 50): Promise<Message[]> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return []
    }

    setLoading(true)
    setError(null)

    try {
      // Get ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      const messages = await fetchMessages(conversationWith, offset, limit, provider)
      
      // Decrypt messages (placeholder implementation)
      const decryptedMessages = await Promise.all(
        messages.map(async (msg) => ({
          ...msg,
          content: await decryptWithFHEVM(msg.content),
        }))
      )
      
      setLoading(false)
      return decryptedMessages
    } catch (err) {
      handleError(err)
      return []
    }
  }, [isConnected, address, handleError])

  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Get ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      await markMessageAsRead(messageId, signer)
      setLoading(false)
      return true
    } catch (err) {
      handleError(err)
      return false
    }
  }, [isConnected, address, handleError])

  const deleteMessageById = useCallback(async (messageId: string): Promise<boolean> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Get ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      await deleteMessage(messageId, signer)
      setLoading(false)
      return true
    } catch (err) {
      handleError(err)
      return false
    }
  }, [isConnected, address, handleError])

  // Channel functions
  const createNewChannel = useCallback(async (channelName: string, members: string[]): Promise<boolean> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Get ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      await createChannel(channelName, members, signer)
      setLoading(false)
      return true
    } catch (err) {
      handleError(err)
      return false
    }
  }, [isConnected, address, handleError])

  const sendMessageToChannel = useCallback(async (channelName: string, content: string): Promise<string | null> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Get ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      const messageId = await sendChannelMessage(channelName, content, signer)
      setLoading(false)
      return messageId
    } catch (err) {
      handleError(err)
      return null
    }
  }, [isConnected, address, handleError])

  const getChannelMessages = useCallback(async (channelName: string, offset = 0, limit = 50): Promise<Message[]> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return []
    }

    setLoading(true)
    setError(null)

    try {
      // Get ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      const messages = await fetchChannelMessages(channelName, offset, limit, provider)
      
      // Decrypt messages (placeholder implementation)
      const decryptedMessages = await Promise.all(
        messages.map(async (msg) => ({
          ...msg,
          content: await decryptWithFHEVM(msg.content),
        }))
      )
      
      setLoading(false)
      return decryptedMessages
    } catch (err) {
      handleError(err)
      return []
    }
  }, [isConnected, address, handleError])

  return {
    // State
    loading,
    error,
    
    // User message functions
    sendMessageToUser,
    getMessages,
    markAsRead,
    deleteMessageById,
    
    // Channel functions
    createNewChannel,
    sendMessageToChannel,
    getChannelMessages,
    
    // Utility
    clearError: () => setError(null),
  }
}
