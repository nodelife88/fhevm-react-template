export function getAvatarColor(address: string): string {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-cyan-500",
    "bg-emerald-500",
  ]

  // Generate a consistent color based on address
  const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function getInitials(address: string): string {
  return address.slice(2, 4).toUpperCase()
}
