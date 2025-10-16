"use client"

import { useState, useCallback, useEffect } from "react"
import { useWeb3 } from "@/lib/web3-context"
import { ethers } from "ethers"
import { toHex0x, isValidAddress, normalizeAddress } from "@/lib/utils"
import {
  sendMessage,
  sendMessagePrepared,
  fetchMessages,
  markMessageAsRead,
  deleteMessage,
  createChannel,
  sendChannelMessage,
  sendChannelMessagePrepared,
  fetchChannelMessages,
  decryptWithFHEVM,
  type Message,
  FHEVM_MESSENGER_ABI,
} from "@/lib/fhevm-contract"
import { useFHEEncryption } from "@/lib/fhevm-sdk"
import { useFhevmContext } from "@/lib/fhevm-context"
import { MESSENGER_ADDRESS, SUPPORTED_CHAIN_ID } from "@/lib/config"

export function useContract() {
  const { address, isConnected, chainId } = useWeb3()
  const { instance, status: fhevmStatus, error: fhevmError } = useFhevmContext()
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (isConnected && typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const s = await provider.getSigner()
          if (!cancelled) setSigner(s)
        } catch {}
      } else {
        setSigner(undefined)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isConnected])
  const { canEncrypt, encryptWith } = useFHEEncryption({ instance, ethersSigner: signer, contractAddress: MESSENGER_ADDRESS })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Small helper to ensure FHEVM is actually usable before encrypting
  const waitForFhevmReady = useCallback(async (timeoutMs = 10000): Promise<void> => {
    const deadline = Date.now() + timeoutMs
    // Fast-path
    if (instance && canEncrypt) return
    // Poll until ready or timeout
    while (Date.now() < deadline) {
      if (instance && canEncrypt) return
      await new Promise((r) => setTimeout(r, 200))
    }
    const rootCause = fhevmError?.message || `status=${fhevmStatus}`
    throw new Error(`FHEVM SDK not ready (${rootCause})`)
  }, [instance, canEncrypt, fhevmError, fhevmStatus])

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
    if (typeof chainId === "number" && chainId !== SUPPORTED_CHAIN_ID) {
      setError("Wrong network. Please switch to the supported chain.")
      return null
    }
    if (!isValidAddress(recipient)) {
      setError("Invalid recipient address")
      return null
    }

    setLoading(true)
    console.debug("[sendMessageToUser] start", { recipient, contentLen: content?.length ?? 0, chainId, isConnected, hasAddr: Boolean(address) })
    setError(null)

    try {
      // Get ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      try { console.debug("[sendMessageToUser] signer acquired", { signerAddress: await signer.getAddress() }) } catch {}
      
      // Ensure FHEVM is ready; wait briefly if still initializing
      // Try prepared path with FHEVM SDK first
      try {
        await waitForFhevmReady()
        console.debug("[sendMessageToUser] FHEVM ready. canEncrypt?", { canEncrypt })
        const enc = await encryptWith((builder: any) => {
          if (typeof builder.add64 === "function") {
            // quotedIdExt = 0 as externalEuint64
            builder.add64(0)
          } else if (typeof builder.add32 === "function") {
            builder.add32(0)
          }
        })
        if (!enc) throw new Error("Encryption failed: enc is undefined")
        console.debug("[sendMessageToUser] enc response", enc)
        try {
          const handles = (enc as any).handles || []
          const sigs = (enc as any).signatures || []
          const inputProof = (enc as any).inputProof
          console.debug("[sendMessageToUser] enc details", {
            handlesCount: handles.length,
            handle0Len: handles[0] ? (typeof handles[0] === "string" ? (handles[0] as string).length : (handles[0] as Uint8Array).length) : 0,
            signaturesCount: sigs.length,
            signature0Len: sigs[0] ? (sigs[0] as string).length : 0,
            hasInputProof: Boolean(inputProof),
            inputProofLen: inputProof ? (typeof inputProof === "string" ? (inputProof as string).length : (inputProof as Uint8Array).length) : 0,
          })
        } catch {}
        const quotedIdExt = toHex0x((enc as any).handles?.[0])
        // Content ciphertext: opaque bytes (frontend-encrypted). For now store utf8 bytes.
        const contentCiphertext = toHex0x(ethers.toUtf8Bytes(content))
        const attestation = toHex0x(((enc as any).inputProof ?? (enc as any).signatures?.[0]) || "0x")
        console.debug("[sendMessageToUser] prepared params", { quotedIdExtLen: quotedIdExt.length, attestationLen: attestation.length, contentCiphertextLen: contentCiphertext.length })
        if (quotedIdExt === "0x" || attestation === "0x") throw new Error("Encryption/attestation missing")
        const preparedId = await sendMessagePrepared(recipient, contentCiphertext, quotedIdExt, attestation, signer)
        console.debug("[sendMessageToUser] prepared send mined", { preparedId })
        setLoading(false)
        return preparedId
      } catch (prepErr) {
        console.warn("[sendMessageToUser] Prepared send failed; falling back to legacy encryption", prepErr)
      }

      // Fallback: legacy send performs internal encryption
      console.debug("[sendMessageToUser] calling legacy sendMessage")
      const messageId = await sendMessage(recipient, content, signer)
      console.debug("[sendMessageToUser] legacy send mined", { messageId })
      setLoading(false)
      return messageId
    } catch (err) {
      console.error("[sendMessageToUser] error", err)
      handleError(err)
      return null
    }
  }, [isConnected, address, chainId, handleError, waitForFhevmReady])

  const getMessages = useCallback(async (conversationWith: string, offset = 0, limit = 50): Promise<Message[]> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return []
    }

    setLoading(true)
    setError(null)

    try {
      // Get ethers provider and my address
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const me = await signer.getAddress()
      const rawPartner = conversationWith?.toString().trim()
      if (!rawPartner || !isValidAddress(rawPartner)) throw new Error("Invalid partner address")
      const partner = normalizeAddress(rawPartner)

      // Fetch my inbox, then filter for messages involving the partner
      const allMine = await fetchMessages(me, offset, limit, provider)
      const filtered = allMine.filter((m) => {
        try {
          const s = ethers.getAddress(m.sender)
          const r = ethers.getAddress(m.recipient)
          return s === partner || r === partner
        } catch {
          return false
        }
      })

      // Decrypt messages with FHEVM
      const decryptedMessages = await Promise.all(
        filtered.map(async (msg) => ({
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
    if (typeof chainId === "number" && chainId !== SUPPORTED_CHAIN_ID) {
      setError("Wrong network. Please switch to the supported chain.")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Get ethers signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // Try prepared path with FHEVM SDK first
      try {
        await waitForFhevmReady()
        console.debug("[sendMessageToChannel] FHEVM ready. canEncrypt?", { canEncrypt })
        const enc = await encryptWith((builder: any) => {
          if (typeof builder.add64 === "function") {
            // quotedIdExt = 0 as externalEuint64
            builder.add64(0)
          } else if (typeof builder.add32 === "function") {
            builder.add32(0)
          }
        })
        if (!enc) throw new Error("Encryption failed: enc is undefined")
        console.debug("[sendMessageToChannel] enc response", enc)
        try {
          const handles = (enc as any).handles || []
          const sigs = (enc as any).signatures || []
          const inputProof = (enc as any).inputProof
          console.debug("[sendMessageToChannel] enc details", {
            handlesCount: handles.length,
            handle0Len: handles[0] ? (typeof handles[0] === "string" ? (handles[0] as string).length : (handles[0] as Uint8Array).length) : 0,
            signaturesCount: sigs.length,
            signature0Len: sigs[0] ? (sigs[0] as string).length : 0,
            hasInputProof: Boolean(inputProof),
            inputProofLen: inputProof ? (typeof inputProof === "string" ? (inputProof as string).length : (inputProof as Uint8Array).length) : 0,
          })
        } catch {}
        const quotedIdExt = toHex0x((enc as any).handles?.[0])
        const contentCiphertext = toHex0x(ethers.toUtf8Bytes(content))
        const attestation = toHex0x(((enc as any).inputProof ?? (enc as any).signatures?.[0]) || "0x")
        console.debug("[sendMessageToChannel] prepared params", { quotedIdExtLen: quotedIdExt.length, attestationLen: attestation.length, contentCiphertextLen: contentCiphertext.length })
        if (quotedIdExt === "0x" || attestation === "0x") throw new Error("Encryption/attestation missing")
        const preparedId = await sendChannelMessagePrepared(channelName, contentCiphertext, quotedIdExt, attestation, signer)
        console.debug("[sendMessageToChannel] prepared send mined", { preparedId })
        setLoading(false)
        return preparedId
      } catch (prepErr) {
        console.warn("[sendMessageToChannel] Prepared channel send failed; falling back to legacy encryption", prepErr)
      }

      // Fallback: legacy channel send performs internal encryption
      console.debug("[sendMessageToChannel] calling legacy sendToChannel")
      const messageId = await sendChannelMessage(channelName, content, signer)
      console.debug("[sendMessageToChannel] legacy send mined", { messageId })
      setLoading(false)
      return messageId
    } catch (err) {
      console.error("[sendMessageToChannel] error", err)
      handleError(err)
      return null
    }
  }, [isConnected, address, chainId, handleError, waitForFhevmReady])

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
      
      // Decrypt messages with FHEVM
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

  // Discover conversations for the current user by scanning inbox/outbox
  const listConversations = useCallback(async (): Promise<{ id: string; name: string }[]> => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)

      // Fallback approach: fetch latest messages from our helper fetchMessages for the current user
      // and derive unique counterparties (direct messages only).
      const recent = await fetchMessages(address, 0, 100, provider)
      const unique = new Map<string, { id: string; name: string }>()
      for (const m of recent) {
        const counterparty = m.sender.toLowerCase() === address.toLowerCase() ? m.recipient : m.sender
        const key = counterparty.toLowerCase()
        if (!unique.has(key)) {
          unique.set(key, { id: key, name: counterparty })
        }
      }

      setLoading(false)
      return Array.from(unique.values())
    } catch (err) {
      handleError(err)
      return []
    }
  }, [isConnected, address, handleError])

  return {
    // State
    loading,
    error,
    fhevmStatus,
    fhevmReady: Boolean(instance && canEncrypt && encryptWith),
    
    // User message functions
    sendMessageToUser,
    getMessages,
    markAsRead,
    deleteMessageById,
    
    // Channel functions
    createNewChannel,
    sendMessageToChannel,
    getChannelMessages,
    listConversations,
    
    // Utility
    clearError: () => setError(null),
  }
}
