"use client"

import type React from "react"
import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReactionType } from "@/types"
import { encryptChunksForContract, encryptStringForContract } from "@/services"
import { useFHESealrStore } from "@/store/useFHESealrStore"
import { useRainbowKitEthersSigner } from "@/hooks/useRainbowKitEthersSigner"
import { useFHESealrConversationStore } from "@/store/useFHESealrConversationStore"

const ChatMessageInput: React.FC = () => {
  const [value, setValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const { ethersSigner, address } = useRainbowKitEthersSigner()
  const { fheInstance, contractAddress } = useFHESealrStore()
  const { getActiveConversation, getActiveMessages, setLoading, sendMessage, setActiveMessages, loading } =
    useFHESealrConversationStore()

  function handleChange(text: string) {
    setValue(text)
  }

  async function handleSubmit(message: string) {
    if (!contractAddress || !fheInstance || !ethersSigner) {
      console.error("Cannot send message - missing required dependencies")
      return
    }

    const activeConversation = getActiveConversation()
    if (!activeConversation?.id) {
      console.error("Cannot send message - no active conversation selected")
      return
    }

    setLoading(true)
    setValue("")

    const optimisticMessage = {
      id: Date.now(),
      createdAt: Date.now(),
      sender: address || "",
      content: message,
      direction: "outgoing" as const,
      reaction: "NONE" as any,
      isOptimistic: true,
    }

    const currentMessages = getActiveMessages()
    setActiveMessages([...currentMessages, optimisticMessage])

    try {
      const messsagesEnc = await encryptChunksForContract(contractAddress, fheInstance, ethersSigner, message)
      const reactionEnc = await encryptStringForContract(
        contractAddress,
        fheInstance,
        ethersSigner,
        String(ReactionType.NONE),
      )

      await sendMessage(messsagesEnc, reactionEnc)

      const updatedMessages = getActiveMessages().filter((m: any) => !m.isOptimistic)
      setActiveMessages(updatedMessages)
    } catch (error) {
      console.error("Error sending message:", error)

      if (error instanceof Error && (error.message?.includes("relayer") || error.message?.includes("network"))) {
        console.error("Relayer or network error - message could not be sent")
      }

      const updatedMessages = getActiveMessages().filter((m: any) => !m.isOptimistic)
      setActiveMessages(updatedMessages)
      setValue(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-end gap-3">
        <div className={`flex-1 relative transition-all duration-200 ${isFocused ? "scale-[1.01]" : ""}`}>
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (value.trim() && !loading) handleSubmit(value)
              }
            }}
            placeholder={loading ? "Sending message..." : "Type your message..."}
            disabled={loading}
            rows={1}
            className={`w-full min-h-[48px] max-h-32 px-4 py-3.5 bg-background/80 border-2 ${
              isFocused ? "border-primary/50" : "border-input"
            } rounded-xl text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              height: "auto",
              overflowY: value.split("\n").length > 3 ? "auto" : "hidden",
            }}
          />
        </div>

        <Button
          onClick={() => value.trim() && handleSubmit(value)}
          disabled={!value.trim() || loading}
          size="icon"
          className="h-12 w-12 shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default ChatMessageInput
