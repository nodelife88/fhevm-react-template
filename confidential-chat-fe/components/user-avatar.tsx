import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getAvatarColor, getInitials } from "@/lib/avatar-utils"

interface UserAvatarProps {
  address: string
  size?: "sm" | "md" | "lg"
  showOnline?: boolean
  isOnline?: boolean
}

export function UserAvatar({ address, size = "md", showOnline = false, isOnline = false }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], "border-2 border-background")}>
        <AvatarFallback className={cn(getAvatarColor(address), "text-white font-semibold")}>
          {getInitials(address)}
        </AvatarFallback>
      </Avatar>
      {showOnline && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
            isOnline ? "bg-green-500" : "bg-gray-400",
          )}
        />
      )}
    </div>
  )
}
