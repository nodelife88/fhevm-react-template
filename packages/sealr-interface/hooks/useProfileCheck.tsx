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
      if (!isConnected || !contractIsReady || !address) {
        return
      }

      setIsChecking(true)
      try {
        const userProfile = await getProfile()

        if (userProfile) {
          router.push("/chat")
        } else {
          setShowProfileSetup(true)
        }
      } catch (err) {
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
