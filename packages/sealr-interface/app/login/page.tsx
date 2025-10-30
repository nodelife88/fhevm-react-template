"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useFHESealrContracts } from "@/hooks/useFHESealr"
import { useFHESealrStore } from "@/store/useFHESealrStore"
import { useFHESealrLoginStore } from "@/store/useFHESealrLoginStore"
import { useRainbowKitEthersSigner } from "@/hooks/useRainbowKitEthersSigner"
import { useFHESealrConversationStore } from "@/store/useFHESealrConversationStore"

const Login: React.FC = () => {
  useFHESealrContracts()
  const { push } = useRouter()
  const [name, setName] = useState("")

  const { contractIsReady } = useFHESealrStore()
  const { setActiveMessages, setActiveConversation } = useFHESealrConversationStore()
  const { address, isConnected } = useRainbowKitEthersSigner()
  const { loading, error, profile, nameExists, getProfile, createProfile } = useFHESealrLoginStore()

  async function onLogin(): Promise<void> {
    if (profile !== null) return push("/chat")
    if (await nameExists(name)) return
    if (profile === null) {
      await createProfile(name)
      if ((await getProfile()) !== null) push("/chat")
    }
  }

  useEffect(() => {
    async function fetchProfile() {
      const profile = await getProfile()
      setName(profile?.name ?? "")
    }

    fetchProfile()
  }, [contractIsReady])

  useEffect(() => {
    setActiveMessages([])
    setActiveConversation(null)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome to Sealr</h1>
          <p className="text-muted-foreground text-center">Enter your name to start secure messaging</p>
        </div>

        {/* Login form */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                placeholder="Enter your name"
                className={`w-full h-11 pl-10 pr-4 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                  profile !== null ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={profile !== null || !isConnected}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button disabled={Boolean(!name.trim() && address)} className="w-full h-11" onClick={onLogin}>
            {address ? "Continue to Chat" : "Connect Wallet"}
          </Button>

          {!isConnected && <p className="text-xs text-center text-muted-foreground">Connect your wallet to continue</p>}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Setting up your profile...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
