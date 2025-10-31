import type React from "react"

interface ConversationProps {
  name?: React.ReactNode
  info?: React.ReactNode
  children?: React.ReactNode
  active?: boolean
}

const Conversation: React.FC<ConversationProps> = ({ name, info, children, active = false }) => {
  return (
    <div className="flex items-center py-3 px-3">
      {children && <div className="mr-3.5 flex-shrink-0">{children}</div>}

      <div className="flex-1 min-w-0">
        {name && <div className="font-semibold text-[15px] text-foreground truncate mb-0.5">{name}</div>}
        {info && <span className="text-xs text-muted-foreground/80 font-medium">{info}</span>}
      </div>
    </div>
  )
}

export default Conversation
