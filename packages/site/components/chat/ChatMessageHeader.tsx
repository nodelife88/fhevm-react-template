import type React from "react"
import Avatar from "@/components/shared/Avatar"
import type { Conversation } from "@/types"
import { useRainbowKitEthersSigner } from "@/hooks/useRainbowKitEthersSigner"
import { useFHESealrConversationStore } from "@/store/useFHESealrConversationStore"
import { Shield } from "lucide-react"

const ChatMessageHeader: React.FC = () => {
  const { address } = useRainbowKitEthersSigner()
  const { activeConversation } = useFHESealrConversationStore()

  function getConversationDisplayName(address: string | undefined, conversation: Conversation | null): string {
    return (
      (address?.toLowerCase() === conversation?.receiver?.toLowerCase()
        ? conversation?.senderName
        : conversation?.receiverName) ?? ""
    )
  }

  return (
    <section className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-md">
            <Avatar name={getConversationDisplayName(address, activeConversation)} />
          </div>
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-card shadow-sm" />
        </div>
        <div>
          <div className="font-semibold text-foreground text-base">
            {getConversationDisplayName(address, activeConversation)}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full">
              <Shield className="h-3 w-3 text-primary" />
              <span className="font-medium text-primary">Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ChatMessageHeader
