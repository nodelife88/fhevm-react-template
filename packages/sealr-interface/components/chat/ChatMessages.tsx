"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { FacebookSelector } from "@charkour/react-reactions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FhevmDecryptionSignature } from "@fhevm-sdk"
import { useFHESealrConversationStore } from "@/store/useFHESealrConversationStore"
import { useFHESealrStore } from "@/store/useFHESealrStore"
import { useRainbowKitEthersSigner } from "@/hooks/useRainbowKitEthersSigner"
import { encryptStringForContract, decryptHandles } from "@/services"
import { renderTime, bigIntToString } from "@/utils"

import { type Message as MessageType, type EncryptedMessage, type ReactionType, ReactionMap } from "@/types"

const ChatMessages: React.FC = () => {
  const { address, ethersSigner } = useRainbowKitEthersSigner()
  const { contractTx, fheInstance, contractAddress, fhevmDecryptionSignatureStorage } = useFHESealrStore()
  const {
    activeConversation,
    activeMessages,
    reactionMessage,
    fetchMessage,
    getActiveConversation,
    getActiveMessages,
    fetchActiveMessages,
    setActiveMessages,
    setActiveConversation,
    fetchConversations,
    setLoading,
  } = useFHESealrConversationStore()

  async function handleReaction(idx: number, messageId: number, reaction: ReactionType) {
    if (contractAddress && fheInstance && ethersSigner) {
      const messages = getActiveMessages()
      const currentReaction = messages[idx]?.reaction
      if (currentReaction === reaction) return

      setLoading(true)
      try {
        const reactionEnc = await encryptStringForContract(contractAddress, fheInstance, ethersSigner, reaction)
        const hasChangeReaction = await reactionMessage(messageId, reactionEnc)

        if (hasChangeReaction) {
          const updatedMessages = [...messages]
          updatedMessages[idx] = { ...updatedMessages[idx], reaction }
          setActiveMessages(updatedMessages)
        }
      } catch (error) {
        console.error("Error changing reaction:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  async function decryptMessages(messages: EncryptedMessage[]): Promise<MessageType[] | null> {
    if (!contractAddress || !fheInstance || !ethersSigner) {
      return null
    }

    try {
      if (!fheInstance || !contractAddress) {
        throw new Error("FHE instance or contract address not available - relayer may be down")
      }

      const sig = await FhevmDecryptionSignature.loadOrSign(
        fheInstance,
        [contractAddress],
        ethersSigner,
        fhevmDecryptionSignatureStorage,
      )

      if (!sig) {
        return null
      }

      const processedMessages =
        messages?.map((m: any) => ({
          id: m[0],
          conversationId: m[1],
          sender: m[2],
          createdAt: m[3],
          status: m[4],
          content: m[5],
          reactionEncrypted: m[6],
        })) ?? []

      const handles =
        processedMessages?.flatMap((m: any) => [
          ...m.content.map((h: any) => ({ handle: h, contractAddress })),
          { handle: m.reactionEncrypted, contractAddress },
        ]) ?? []

      const decryptedHandles = await decryptHandles(fheInstance, handles ?? [], sig, String(activeConversation?.id))

      // Check if we have enough decrypted handles to proceed
      const decryptedCount = Object.keys(decryptedHandles).length;
      if (decryptedCount === 0 && handles.length > 0) {
        console.error("No handles could be decrypted - decryption may have failed");
        return null;
      }

      const result = processedMessages.map((m) => {
        const content = m.content
          .map((h: any) => {
            const decrypted = decryptedHandles[h];
            if (decrypted === undefined) {
              console.warn(`Missing decrypted value for handle: ${h}`);
              return '';
            }
            return bigIntToString(BigInt(decrypted));
          })
          .join("");

        const reactionArray = [m.reactionEncrypted].map((h: any) => {
          const decrypted = decryptedHandles[h];
          if (decrypted === undefined) {
            console.warn(`Missing decrypted reaction for handle: ${h}`);
            return '';
          }
          return bigIntToString(BigInt(decrypted));
        });

        return {
          id: Number(m.id),
          createdAt: Number(m.createdAt),
          sender: String(m.sender),
          content,
          direction: (String(m.sender).toLowerCase() === address?.toLowerCase() ? "outgoing" : "incoming") as
            | "outgoing"
            | "incoming",
          reaction: reactionArray.join("") as ReactionType,
        };
      })

      return result
    } catch (error) {
      console.error("Error in decryptMessages:", error)

      if (
        error instanceof Error &&
        (error.message?.includes("relayer") || error.message?.includes("network") || error.message?.includes("fetch"))
      ) {
        console.error("Relayer or network error - messages cannot be decrypted")
      }

      return null
    }
  }

  async function decryptContent(message: EncryptedMessage): Promise<MessageType | null> {
    if (contractAddress && fheInstance && ethersSigner) {
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fheInstance,
        [contractAddress],
        ethersSigner,
        fhevmDecryptionSignatureStorage,
      )
      if (!sig) return null

      const handles = message.content.map((h: Uint8Array) => ({
        handle: h as unknown as string,
        contractAddress: contractAddress as `0x${string}`,
      }))
      const decryptedHandles = await decryptHandles(fheInstance, handles, sig)

      const decryptedContent = message.content.map((h: Uint8Array) =>
        bigIntToString(BigInt(decryptedHandles[h as any])),
      )

      const newMessage: MessageType = {
        id: Number(message.id),
        createdAt: Number(message.createdAt),
        sender: String(message.sender),
        content: decryptedContent.join(""),
        direction: String(message.sender).toLowerCase() === address?.toLowerCase() ? "outgoing" : "incoming",
        reaction: "" as ReactionType,
      }

      return newMessage
    }

    return null
  }

  async function decryptReaction(message: EncryptedMessage): Promise<MessageType | null> {
    if (contractAddress && fheInstance && ethersSigner) {
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fheInstance,
        [contractAddress],
        ethersSigner,
        fhevmDecryptionSignatureStorage,
      )
      if (!sig) return null

      const handles = [
        { handle: message.reaction as unknown as string, contractAddress: contractAddress as `0x${string}` },
      ]

      const decryptedHandles = await decryptHandles(fheInstance, handles, sig)
      const decryptedReaction = [bigIntToString(BigInt(decryptedHandles[message.reaction as any]))]

      const newMessage: MessageType = {
        id: Number(message.id),
        createdAt: Number(message.createdAt),
        sender: String(message.sender),
        content: "",
        direction: String(message.sender).toLowerCase() === address?.toLowerCase() ? "outgoing" : "incoming",
        reaction: decryptedReaction.join("") as ReactionType,
      }

      return newMessage
    }

    return null
  }

  const [visibleCount, setVisibleCount] = useState(30)
  const [decryptionError, setDecryptionError] = useState(false)

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    try {
      const target = e.currentTarget
      if (target.scrollTop <= 0) {
        setVisibleCount((prev) => prev + 30)
      }
    } catch {}
  }

  useEffect(() => {
    async function loadMessages() {
      setLoading(true)
      setDecryptionError(false) // Reset error state when loading new messages

      try {
        const encryptMessages = await fetchActiveMessages(Number(activeConversation?.id) ?? 0)

        if (encryptMessages && encryptMessages.length > 0) {
          const sorted = [...encryptMessages].sort((a: any, b: any) => Number(a[3]) - Number(b[3]))
          const sliceStart = Math.max(0, sorted.length - visibleCount)
          const toDecrypt = sorted.slice(sliceStart)
          const decryptMessage = await decryptMessages(toDecrypt)

          if (decryptMessage === null) {
            // Don't clear the active conversation if decryption fails
            // Just show an empty message list with a warning
            console.warn("Unable to decrypt messages - relayer or network may be experiencing issues")
            setDecryptionError(true)
            setActiveMessages([])
          } else {
            setDecryptionError(false)
            setActiveMessages(decryptMessage)
          }
        } else {
          // No messages to decrypt - this is normal for an empty conversation
          setActiveMessages([])
          setDecryptionError(false)
        }
      } catch (error) {
        console.error("Error loading messages:", error)
        // Don't clear the active conversation on error
        setActiveMessages([])
        setDecryptionError(true)
      }

      setLoading(false)
    }

    if (activeConversation?.id && ethersSigner && contractAddress && fheInstance) {
      loadMessages()
    }
  }, [activeConversation, ethersSigner, contractAddress, fheInstance, visibleCount])

  useEffect(() => {
    if (!contractTx || !address) return

    const handleMessageSent = async (messageId: number, conversationId: number, from: string) => {
      try {
        const currentConversationId = Number(getActiveConversation()?.id)

        if (currentConversationId === Number(conversationId)) {
          // Add a small delay to ensure the message is indexed in the blockchain
          await new Promise(resolve => setTimeout(resolve, 500))
          
          if (from?.toLowerCase() === address?.toLowerCase()) {
            // User sent this message - replace optimistic message with real one
            const currentMessages = getActiveMessages()
            const encryptMessages = await fetchMessage(messageId)
            const decryptMessage = await decryptContent(encryptMessages as EncryptedMessage)
            if (decryptMessage) {
              // Remove optimistic messages and add the real message
              const realMessages = currentMessages.filter((m: any) => !m.isOptimistic)
              setActiveMessages([...realMessages, decryptMessage])
            }
          } else {
            // Someone else sent this message - just add it
            const encryptMessages = await fetchMessage(messageId)
            const decryptMessage = await decryptContent(encryptMessages as EncryptedMessage)
            if (decryptMessage) {
              setActiveMessages([...getActiveMessages(), decryptMessage])
            }
          }
        } else if (currentConversationId === 0) {
          setActiveConversation({ ...activeConversation, id: Number(conversationId) })
        }
      } catch (error) {
        console.error("Error handling MessageSent:", error)
      }
    }

    const handleReactionChanged = async (messageId: number, from: string) => {
      try {
        const messages = getActiveMessages()
        const idx = messages.findIndex((m: MessageType) => m.id === Number(messageId))
        if (idx < 0 || from?.toLowerCase() === address?.toLowerCase()) return

        const encryptMessages = await fetchMessage(Number(messageId))
        const decryptMessage = await decryptReaction(encryptMessages as EncryptedMessage)

        if (decryptMessage) {
          const updatedMessages = [...messages]
          updatedMessages[idx].reaction = decryptMessage.reaction
          setActiveMessages(updatedMessages)
        }
      } catch (error) {
        console.error("Error handling ReactionChanged:", error)
      }
    }

    try {
      contractTx.on("MessageSent", handleMessageSent)
      contractTx.on("ReactionChanged", handleReactionChanged)
    } catch (error) {
      console.error("Error setting up event listeners:", error)
    }

    return () => {
      try {
        contractTx.off("MessageSent", handleMessageSent)
        contractTx.off("ReactionChanged", handleReactionChanged)
      } catch (error) {
        console.error("Error removing event listeners:", error)
      }
    }
  }, [contractTx, address, activeConversation])

  return (
    <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-background to-background/95">
      <div className="space-y-3 max-w-4xl mx-auto pb-4">
        {decryptionError && activeMessages.length === 0 && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 max-w-md">
              <div className="text-2xl">⚠️</div>
              <h3 className="text-base font-semibold text-foreground">Unable to load messages</h3>
              <p className="text-sm text-muted-foreground">
                The encryption service is temporarily unavailable. Please try again in a moment.
              </p>
            </div>
          </div>
        )}
        {activeMessages.map((msg: MessageType, index) => {
          const nextMsg = activeMessages[index + 1]
          const prevMsg = activeMessages[index - 1]
          const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender || nextMsg.direction !== msg.direction
          const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender || prevMsg.direction !== msg.direction
          const isOutgoing = msg.direction === "outgoing"

          return (
            <div
              key={msg.id}
              className={`flex ${isOutgoing ? "justify-end" : "justify-start"} group animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`max-w-[75%] ${isOutgoing ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className={`relative px-4 py-3 ${
                    isOutgoing
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card text-foreground shadow-md border border-border/50"
                  } ${
                    isFirstInGroup && isLastInGroup
                      ? "rounded-2xl"
                      : isFirstInGroup
                        ? isOutgoing
                          ? "rounded-2xl rounded-br-md"
                          : "rounded-2xl rounded-bl-md"
                        : isLastInGroup
                          ? isOutgoing
                            ? "rounded-2xl rounded-tr-md"
                            : "rounded-2xl rounded-tl-md"
                          : isOutgoing
                            ? "rounded-2xl rounded-r-md"
                            : "rounded-2xl rounded-l-md"
                  } transition-all hover:scale-[1.02]`}
                >
                  <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>

                  <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-1.5">
                      <FacebookSelector
                        iconSize={22}
                        onSelect={(reaction) => handleReaction(index, msg.id, reaction as ReactionType)}
                      />
                    </div>
                  </div>

                  {ReactionMap[msg.reaction] && (
                    <div className="absolute -bottom-2.5 -right-2.5 bg-background border-2 border-border rounded-full w-7 h-7 flex items-center justify-center text-base shadow-md hover:scale-110 transition-transform">
                      {ReactionMap[msg.reaction]}
                    </div>
                  )}
                </div>

                {isLastInGroup && (
                  <span className="text-xs text-muted-foreground/80 px-3 mt-0.5 font-medium">
                    {renderTime(msg.createdAt ?? 0)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export default ChatMessages
