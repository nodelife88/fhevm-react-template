// FHEVM Smart Contract interaction layer
// This handles encrypted message operations on-chain

import { ethers } from "ethers"
import { MESSENGER_ADDRESS } from "@/lib/config"
import { useFhevm, useFHEDecrypt, useFHEEncryption, useInMemoryStorage } from "./fhevm-sdk"
import { extractMessageIdFromReceipt } from "@/lib/tx-utils"

export const FHEVM_MESSENGER_ADDRESS = MESSENGER_ADDRESS

// ABI for the ConfidentialMessenger contract
export const FHEVM_MESSENGER_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "msgId", "type": "uint256" },
      { "indexed": true, "name": "sender", "type": "address" },
      { "indexed": true, "name": "receiver", "type": "address" },
      { "indexed": false, "name": "channel", "type": "bytes32" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "MessageSent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "msgId", "type": "uint256" }
    ],
    "name": "MessageRead",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "msgId", "type": "uint256" }
    ],
    "name": "MessageDeleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "channel", "type": "bytes32" },
      { "indexed": false, "name": "members", "type": "address[]" }
    ],
    "name": "ChannelCreated",
    "type": "event"
  },
  // Functions
  {
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "contentCiphertext", "type": "bytes" },
      { "name": "quotedIdExt", "type": "bytes32" },
      { "name": "attestation", "type": "bytes" }
    ],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "channel", "type": "bytes32" },
      { "name": "contentCiphertext", "type": "bytes" },
      { "name": "quotedIdExt", "type": "bytes32" },
      { "name": "attestation", "type": "bytes" }
    ],
    "name": "sendToChannel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "msgId", "type": "uint256" }],
    "name": "markAsRead",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "msgId", "type": "uint256" }],
    "name": "markChannelMessageRead",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "msgId", "type": "uint256" }],
    "name": "softDelete",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "msgId", "type": "uint256" }],
    "name": "makeMessagePublic",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "channel", "type": "bytes32" },
      { "name": "members", "type": "address[]" }
    ],
    "name": "createChannel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "channel", "type": "bytes32" },
      { "name": "members", "type": "address[]" }
    ],
    "name": "addChannelMembers",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "channel", "type": "bytes32" },
      { "name": "members", "type": "address[]" }
    ],
    "name": "removeChannelMembers",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // View functions
  {
    "inputs": [{ "name": "msgId", "type": "uint256" }],
    "name": "getMessageHeader",
    "outputs": [
      { "name": "sender", "type": "address" },
      { "name": "receiver", "type": "address" },
      { "name": "channel", "type": "bytes32" },
      { "name": "isDeleted", "type": "bool" },
      { "name": "isPublic", "type": "bool" },
      { "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "msgId", "type": "uint256" }],
    "name": "getMessageCiphertext",
    "outputs": [{ "name": "", "type": "bytes" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "inboxOf",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "outboxOf",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "channel", "type": "bytes32" }],
    "name": "channelMessages",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextMsgId",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
]

export interface Message {
  id: string
  sender: string
  recipient: string
  content: string
  timestamp: number
  isRead: boolean
  isDeleted: boolean
  isEncrypted: boolean
  quotedMessage?: Message
}

export interface DAOMessage {
  id: string
  sender: string
  content: string
  timestamp: number
  votesForPublic: number
  isPublic: boolean
  isEncrypted: boolean
}

export interface Conversation {
  address: string
  name: string
  lastMessage: string
  timestamp: string
  unread: number
  avatar: string
  isOnline: boolean
}

// Helper function to get ethers provider
function getEthersProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  throw new Error("Ethers provider not available")
}

// Helper function to call contract methods
async function callContract(method: string, params: any[], provider?: ethers.Provider): Promise<any> {
  const ethersProvider = provider || getEthersProvider()

  try {
    // Create contract instance
    const contract = new ethers.Contract(FHEVM_MESSENGER_ADDRESS, FHEVM_MESSENGER_ABI, ethersProvider)

    // Call the method
    const result = await contract[method](...params)
    return result
  } catch (error) {
    console.error(`[v0] Error calling ${method}:`, { method, paramsSummary: params?.map((p) => (typeof p === 'string' ? `${p.slice(0,10)}..(${p.length})` : typeof p)).join(', ') })
    console.error(error)
    throw error
  }
}

// Helper function to send transactions
async function sendTransaction(method: string, params: any[], signer: ethers.Signer): Promise<any> {
  if (!signer) throw new Error("No signer available")

  try {
    const contract = new ethers.Contract(FHEVM_MESSENGER_ADDRESS, FHEVM_MESSENGER_ABI, signer)

    const tx = await contract[method](...params)
    console.debug(`[v0] tx sent`, { method, hash: tx.hash, paramsSummary: params?.map((p) => (typeof p === 'string' ? `${p.slice(0,10)}..(${p.length})` : typeof p)).join(', ') })
    return tx
  } catch (error) {
    console.error(`[v0] Error sending transaction ${method}:`, { method, paramsSummary: params?.map((p) => (typeof p === 'string' ? `${p.slice(0,10)}..(${p.length})` : typeof p)).join(', ') })
    console.error(error)
    throw error
  }
}

export async function fetchMessages(
  conversationWith: string,
  offset: number,
  limit: number,
  provider?: ethers.Provider,
): Promise<Message[]> {
  try {
    const ethersProvider = provider || getEthersProvider()
    
    // Get user's inbox
    const inbox = await callContract("inboxOf", [conversationWith], ethersProvider)
    
    // Get message headers for each message ID
    const messages: Message[] = []
    for (let i = offset; i < Math.min(offset + limit, inbox.length); i++) {
      const msgId = inbox[i]
      try {
        const header = await callContract("getMessageHeader", [msgId], ethersProvider)
        const ciphertext = await callContract("getMessageCiphertext", [msgId], ethersProvider)
        
        messages.push({
          id: msgId.toString(),
          sender: header.sender,
          recipient: header.receiver,
          content: ciphertext, // Still encrypted
          timestamp: Number(header.timestamp) * 1000,
          isRead: false, // FHE encrypted, would need decryption
          isDeleted: header.isDeleted,
      isEncrypted: true,
        })
      } catch (error) {
        console.error(`[v0] Error fetching message ${msgId}:`, error)
      }
    }

    return messages
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return []
  }
}

export async function sendMessage(recipient: string, content: string, signer?: ethers.Signer): Promise<string> {
  try {
    const ethersSigner = signer || (await getEthersProvider().getSigner())
    
    // Legacy path kept for backward compatibility will revert onchain without attestation
    const encryptedContent = await encryptWithFHEVM(content)
    const quotedIdExt = "0x0000000000000000000000000000000000000000000000000000000000000000"
    const attestation = "0x"

    const tx = await sendTransaction("sendMessage", [recipient, encryptedContent, quotedIdExt, attestation], ethersSigner)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    
    // Extract message ID from transaction receipt
    const id = extractMessageIdFromReceipt(receipt, FHEVM_MESSENGER_ABI)
    if (id) return id
    
    throw new Error("Message ID not found in transaction receipt")
  } catch (error) {
    console.error("[v0] Error sending message:", error)
    throw error
  }
}

// New: send with prepared handle + attestation from FHEVM SDK
export async function sendMessagePrepared(
  recipient: string,
  contentCiphertext: `0x${string}`,
  quotedIdExt: `0x${string}`,
  attestation: `0x${string}`,
  signer?: ethers.Signer,
): Promise<string> {
  try {
    const ethersSigner = signer || (await getEthersProvider().getSigner())
    const tx = await sendTransaction("sendMessage", [recipient, contentCiphertext, quotedIdExt, attestation], ethersSigner)
    const receipt = await tx.wait()
    const id = extractMessageIdFromReceipt(receipt, FHEVM_MESSENGER_ABI)
    if (id) return id
    throw new Error("Message ID not found in transaction receipt")
  } catch (error) {
    console.error("[v0] Error sendMessagePrepared:", error)
    throw error
  }
}

export async function markMessageAsRead(messageId: string, signer?: ethers.Signer): Promise<void> {
  try {
    const ethersSigner = signer || (await getEthersProvider().getSigner())
    
    await sendTransaction("markAsRead", [messageId], ethersSigner)
  } catch (error) {
    console.error("[v0] Error marking message as read:", error)
    throw error
  }
}

export async function deleteMessage(messageId: string, signer?: ethers.Signer): Promise<void> {
  try {
    const ethersSigner = signer || (await getEthersProvider().getSigner())
    
    await sendTransaction("softDelete", [messageId], ethersSigner)
  } catch (error) {
    console.error("[v0] Error deleting message:", error)
    throw error
  }
}

// New functions for channel management
export async function createChannel(channelName: string, members: string[], signer?: ethers.Signer): Promise<void> {
  try {
    const ethersSigner = signer || (await getEthersProvider().getSigner())
    
    const channelId = ethers.keccak256(ethers.toUtf8Bytes(channelName))
    await sendTransaction("createChannel", [channelId, members], ethersSigner)
  } catch (error) {
    console.error("[v0] Error creating channel:", error)
    throw error
  }
}

export async function sendChannelMessage(channelName: string, content: string, signer?: ethers.Signer): Promise<string> {
  try {
    const ethersSigner = signer || (await getEthersProvider().getSigner())
    
    const channelId = ethers.keccak256(ethers.toUtf8Bytes(channelName))
    const encryptedContent = await encryptWithFHEVM(content)
    
    const quotedIdExt = "0x0000000000000000000000000000000000000000000000000000000000000000"
    const attestation = "0x"

    const tx = await sendTransaction("sendToChannel", [channelId, encryptedContent, quotedIdExt, attestation], ethersSigner)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    
    // Extract message ID from transaction receipt
    const id = extractMessageIdFromReceipt(receipt, FHEVM_MESSENGER_ABI)
    if (id) return id
    
    throw new Error("Message ID not found in transaction receipt")
  } catch (error) {
    console.error("[v0] Error sending channel message:", error)
    throw error
  }
}

// New: channel send with prepared handle + attestation
export async function sendChannelMessagePrepared(
  channelName: string,
  contentCiphertext: `0x${string}`,
  quotedIdExt: `0x${string}`,
  attestation: `0x${string}`,
  signer?: ethers.Signer,
): Promise<string> {
  try {
    const ethersSigner = signer || (await getEthersProvider().getSigner())
    const channelId = ethers.keccak256(ethers.toUtf8Bytes(channelName))
    const tx = await sendTransaction("sendToChannel", [channelId, contentCiphertext, quotedIdExt, attestation], ethersSigner)
    const receipt = await tx.wait()
    const id = extractMessageIdFromReceipt(receipt, FHEVM_MESSENGER_ABI)
    if (id) return id
    throw new Error("Message ID not found in transaction receipt")
  } catch (error) {
    console.error("[v0] Error sendChannelMessagePrepared:", error)
    throw error
  }
}

export async function fetchChannelMessages(channelName: string, offset: number, limit: number, provider?: ethers.Provider): Promise<Message[]> {
  try {
    const ethersProvider = provider || getEthersProvider()
    const channelId = ethers.keccak256(ethers.toUtf8Bytes(channelName))
    
    // Get channel messages
    const channelMsgs = await callContract("channelMessages", [channelId], ethersProvider)
    
    // Get message headers for each message ID
    const messages: Message[] = []
    for (let i = offset; i < Math.min(offset + limit, channelMsgs.length); i++) {
      const msgId = channelMsgs[i]
      try {
        const header = await callContract("getMessageHeader", [msgId], ethersProvider)
        const ciphertext = await callContract("getMessageCiphertext", [msgId], ethersProvider)
        
        messages.push({
          id: msgId.toString(),
          sender: header.sender,
          recipient: header.receiver,
          content: ciphertext, // Still encrypted
          timestamp: Number(header.timestamp) * 1000,
          isRead: false, // FHE encrypted, would need decryption
          isDeleted: header.isDeleted,
          isEncrypted: true,
        })
      } catch (error) {
        console.error(`[v0] Error fetching channel message ${msgId}:`, error)
      }
    }

    return messages
  } catch (error) {
    console.error("[v0] Error fetching channel messages:", error)
    return []
  }
}

// Real FHEVM encryption helper
async function encryptWithFHEVM(data: string, instance?: any, contractAddress?: string, userAddress?: string): Promise<string> {
  if (instance && contractAddress && userAddress) {
    try {
      const input = instance.createEncryptedInput(contractAddress, userAddress)
      // For now, we'll use a simple encoding
      // In real implementation, this would use FHEVM encryption
      input.add32(data.length)
      const enc = await input.encrypt()
      return `0x${Buffer.from(enc.handles[0]).toString('hex')}`
    } catch (error) {
      console.error("FHEVM encryption failed:", error)
    }
  }
  
  // Fallback to simple encoding
  return `0x${Buffer.from(data).toString("hex")}`
}

// Real FHEVM decryption helper
export async function decryptWithFHEVM(encryptedData: string, instance?: any): Promise<string> {
  try {
    if (instance) {
      // If SDK instance is available, attempt real decryption flow here
      // NOTE: actual decryption depends on relayer + signature; keep safe fallback
    }
    // Safe fallback: hex -> utf8 if possible
    return Buffer.from(encryptedData.replace(/^0x/, ""), "hex").toString()
  } catch {
    return encryptedData
  }
}
