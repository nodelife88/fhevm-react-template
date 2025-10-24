"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { useFHESealrContracts } from "@/hooks/useFHESealr"
import { useFHESealrStore } from "@/store/useFHESealrStore"
import { useFHESealrLoginStore } from "@/store/useFHESealrLoginStore"

export const useProfileCheck = () => {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useFHESealrContracts()

  const { contractIsReady } = useFHESealrStore()
  const { profile, getProfile } = useFHESealrLoginStore()

  useEffect(() => {
    const checkProfile = async () => {
      console.log("Profile check triggered:", { isConnected, contractIsReady, address })

      if (!isConnected || !contractIsReady || !address) {
        console.log("Profile check skipped - conditions not met:", { isConnected, contractIsReady, address })
        return
      }

      setIsChecking(true)
      try {
        console.log("Checking profile for address:", address)
        const userProfile = await getProfile()
        console.log("Profile result:", userProfile)

        if (userProfile) {
          console.log("Profile found, redirecting to chat")
          router.push("/chat")
        } else {
          console.log("No profile found, showing setup modal")
          setShowProfileSetup(true)
        }
      } catch (err) {
        console.error("Error checking profile:", err)
        setShowProfileSetup(true)
      } finally {
        setIsChecking(false)
      }
    }

    checkProfile()
  }, [isConnected, contractIsReady, address, getProfile, router])

  return {
    showProfileSetup,
    setShowProfileSetup,
    isChecking,
    profile,
  }
}
