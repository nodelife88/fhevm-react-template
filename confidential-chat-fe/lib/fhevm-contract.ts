// FHEVM Smart Contract interaction layer
// This handles encrypted message operations on-chain

export const FHEVM_MESSENGER_ADDRESS = "0x0000000000000000000000000000000000000000"

// ABI for the FHEVM Messenger contract
export const FHEVM_MESSENGER_ABI = [
  {
    name: "sendMessage",
    type: "function",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "encryptedContent", type: "bytes" },
      { name: "encryptedMetadata", type: "bytes" },
    ],
    outputs: [{ name: "messageId", type: "uint256" }],
  },
  {
    name: "getMessages",
    type: "function",
    inputs: [
      { name: "conversationWith", type: "address" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "messages",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "sender", type: "address" },
          { name: "recipient", type: "address" },
          { name: "encryptedContent", type: "bytes" },
          { name: "timestamp", type: "uint256" },
          { name: "isRead", type: "bool" },
          { name: "isDeleted", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "markAsRead",
    type: "function",
    inputs: [{ name: "messageId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "deleteMessage",
    type: "function",
    inputs: [{ name: "messageId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "requestDecryption",
    type: "function",
    inputs: [{ name: "messageIds", type: "uint256[]" }],
    outputs: [{ name: "decryptedContents", type: "string[]" }],
  },
  // DAO/Group message functions
  {
    name: "createDAO",
    type: "function",
    inputs: [
      { name: "name", type: "string" },
      { name: "members", type: "address[]" },
    ],
    outputs: [{ name: "daoId", type: "uint256" }],
  },
  {
    name: "sendDAOMessage",
    type: "function",
    inputs: [
      { name: "daoId", type: "uint256" },
      { name: "encryptedContent", type: "bytes" },
    ],
    outputs: [{ name: "messageId", type: "uint256" }],
  },
  {
    name: "getDAOMessages",
    type: "function",
    inputs: [
      { name: "daoId", type: "uint256" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "messages",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "sender", type: "address" },
          { name: "encryptedContent", type: "bytes" },
          { name: "timestamp", type: "uint256" },
          { name: "votesForPublic", type: "uint256" },
          { name: "isPublic", type: "bool" },
        ],
      },
    ],
  },
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

// Helper function to call contract methods
async function callContract(method: string, params: any[], provider: any): Promise<any> {
  if (!provider) throw new Error("No provider available")

  try {
    // Create contract instance
    const contract = new provider.eth.Contract(FHEVM_MESSENGER_ABI, FHEVM_MESSENGER_ADDRESS)

    // Call the method
    const result = await contract.methods[method](...params).call()
    return result
  } catch (error) {
    console.error(`[v0] Error calling ${method}:`, error)
    throw error
  }
}

// Helper function to send transactions
async function sendTransaction(method: string, params: any[], provider: any, from: string): Promise<any> {
  if (!provider) throw new Error("No provider available")

  try {
    const contract = new provider.eth.Contract(FHEVM_MESSENGER_ABI, FHEVM_MESSENGER_ADDRESS)

    const tx = await contract.methods[method](...params).send({ from })
    return tx
  } catch (error) {
    console.error(`[v0] Error sending transaction ${method}:`, error)
    throw error
  }
}

export async function fetchMessages(
  conversationWith: string,
  offset: number,
  limit: number,
  provider: any,
): Promise<Message[]> {
  try {
    const messages = await callContract("getMessages", [conversationWith, offset, limit], provider)

    // Transform blockchain data to app format
    return messages.map((msg: any) => ({
      id: msg.id.toString(),
      sender: msg.sender,
      recipient: msg.recipient,
      content: msg.encryptedContent, // Still encrypted
      timestamp: Number(msg.timestamp) * 1000,
      isRead: msg.isRead,
      isDeleted: msg.isDeleted,
      isEncrypted: true,
    }))
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return []
  }
}

export async function sendMessage(recipient: string, content: string, provider: any, from: string): Promise<string> {
  try {
    // In real implementation, encrypt content with FHEVM before sending
    const encryptedContent = await encryptWithFHEVM(content)
    const encryptedMetadata = await encryptWithFHEVM(JSON.stringify({ timestamp: Date.now() }))

    const tx = await sendTransaction("sendMessage", [recipient, encryptedContent, encryptedMetadata], provider, from)

    return tx.events.MessageSent.returnValues.messageId
  } catch (error) {
    console.error("[v0] Error sending message:", error)
    throw error
  }
}

export async function requestDecryption(messageIds: string[], provider: any, from: string): Promise<string[]> {
  try {
    const decryptedContents = await sendTransaction("requestDecryption", [messageIds], provider, from)

    return decryptedContents
  } catch (error) {
    console.error("[v0] Error requesting decryption:", error)
    throw error
  }
}

export async function markMessageAsRead(messageId: string, provider: any, from: string): Promise<void> {
  try {
    await sendTransaction("markAsRead", [messageId], provider, from)
  } catch (error) {
    console.error("[v0] Error marking message as read:", error)
    throw error
  }
}

export async function deleteMessage(messageId: string, provider: any, from: string): Promise<void> {
  try {
    await sendTransaction("deleteMessage", [messageId], provider, from)
  } catch (error) {
    console.error("[v0] Error deleting message:", error)
    throw error
  }
}

// FHEVM encryption helper (placeholder - actual implementation depends on FHEVM SDK)
async function encryptWithFHEVM(data: string): Promise<string> {
  // This would use the actual FHEVM encryption library
  // For now, return a placeholder
  return `0x${Buffer.from(data).toString("hex")}`
}

// Decrypt with FHEVM (placeholder)
export async function decryptWithFHEVM(encryptedData: string): Promise<string> {
  // This would use the actual FHEVM decryption library
  // For now, return a placeholder
  try {
    return Buffer.from(encryptedData.slice(2), "hex").toString()
  } catch {
    return encryptedData
  }
}
