"use client"

import { useDisconnect as useWagmiDisconnect } from "wagmi"
import { useRouter } from "next/navigation"
import { useFHESealrLoginStore } from "@/store/useFHESealrLoginStore"
import { useFHESealrConversationStore } from "@/store/useFHESealrConversationStore"

function clearAppState() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fhevm-sealr-profile")
    localStorage.removeItem("fhevm-sealr-conversations")
    sessionStorage.clear()
  }
  
  try {
    useFHESealrLoginStore.getState().clearState()
    useFHESealrConversationStore.getState().clearState()
  } catch (error) {
    console.error("Error clearing app state:", error)
  }
}

export function disconnect() {
  clearAppState()
  
  if (typeof window !== "undefined") {
    window.location.href = "/"
  }
}

export function useDisconnect() {
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect()
  const router = useRouter()

  return {
    disconnect: async () => {
      try {
        clearAppState()
        await wagmiDisconnect()
        router.push("/")
      } catch (error) {
        console.error("Error during disconnect:", error)
        if (typeof window !== "undefined") {
          window.location.href = "/"
        }
      }
    },
  }
}
