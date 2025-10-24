"use client"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Shield, Lock, Users, MessageSquare, Key, Eye, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { ProfileSetupModal } from "@/components/shared/ProfileSetupModal"
import { useProfileCheck } from "@/hooks/useProfileCheck"
import { ClipLoader } from "react-spinners"
import { useDisconnect } from "@/utils/auth"

export function LandingPage() {
  const { showProfileSetup, setShowProfileSetup, isChecking } = useProfileCheck()
  const { openConnectModal } = useConnectModal()
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/sealr.svg" alt="Sealr" width={24} height={24} priority />
            <span className="font-mono text-xl font-semibold">Sealr</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Security
            </Link>
            <Link href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Button
                onClick={disconnect}
                variant="outline"
                className="px-4 justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive bg-transparent"
              >
                <LogOut className="h-4 w-4" />
                Disconnect Wallet
              </Button>
            ) : (
              <Button onClick={() => openConnectModal?.()} className="px-4" disabled={!mounted || !openConnectModal}>
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <span className="text-sm font-mono text-primary border border-primary/30 rounded-full px-4 py-1.5">
              Powered by Zama FHEVM
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
            Confidential messaging on-chain
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            End-to-end encrypted conversations using Fully Homomorphic Encryption. Your messages stay private, even on a
            public blockchain.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isConnected ? (
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive bg-transparent"
                onClick={disconnect}
              >
                <LogOut className="h-4 w-4" />
                Disconnect Wallet
              </Button>
            ) : (
              <Button
                size="lg"
                className="text-base px-8"
                onClick={() => openConnectModal?.()}
                disabled={!mounted || !openConnectModal}
              >
                Start Messaging
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 bg-transparent"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 space-y-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Private Messages</h3>
            <p className="text-muted-foreground leading-relaxed">
              Send encrypted 1:1 messages that only you and your recipient can read. Content is encrypted using FHE and
              stored on-chain.
            </p>
          </div>

          <div className="p-6 space-y-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Group Conversations</h3>
            <p className="text-muted-foreground leading-relaxed">
              Create confidential group discussions. Only verified members can decrypt and participate in conversations.
            </p>
          </div>

          <div className="p-6 space-y-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Read Receipts</h3>
            <p className="text-muted-foreground leading-relaxed">
              Track message status with encrypted read receipts. Know when your messages are delivered and read.
            </p>
          </div>

          <div className="p-6 space-y-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Access Control</h3>
            <p className="text-muted-foreground leading-relaxed">
              Fine-grained permissions using EIP-712 signatures. Control who can decrypt your messages with
              cryptographic proofs.
            </p>
          </div>

          <div className="p-6 space-y-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Public Disclosure</h3>
            <p className="text-muted-foreground leading-relaxed">
              Optional message publicization after votes or timeouts. Transparent governance when needed.
            </p>
          </div>

          <div className="p-6 space-y-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">On-Chain Security</h3>
            <p className="text-muted-foreground leading-relaxed">
              All messages stored on-chain with FHE encryption. No centralized servers, no data breaches.
            </p>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Security at every step</h2>
          <p className="text-xl text-muted-foreground text-balance">
            Built on Zama's FHEVM, enabling computation on encrypted data without ever exposing plaintext.
          </p>
        </div>
        <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">On-chain encryption</div>
          </div>
          <div className="text-center space-y-3">
            <div className="text-3xl font-bold text-primary">Zero</div>
            <div className="text-sm text-muted-foreground">Plaintext exposure</div>
          </div>
          <div className="text-center space-y-3">
            <div className="text-3xl font-bold text-primary">FHE</div>
            <div className="text-sm text-muted-foreground">Homomorphic encryption</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="p-12 md:p-16 text-center space-y-6 bg-card border border-border rounded-lg">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to start messaging?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect your wallet and experience truly private, on-chain communication.
          </p>
          {isConnected ? (
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 justify-start gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive bg-transparent"
              onClick={async () => {
                try {
                  await disconnect()
                } catch (error) {
                  console.error("Error during disconnect:", error)
                }
              }}
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </Button>
          ) : (
            <Button
              size="lg"
              className="text-base px-8"
              onClick={() => openConnectModal?.()}
              disabled={!mounted || !openConnectModal}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/sealr.svg" alt="Sealr" width={20} height={20} />
              <span className="font-mono text-sm">Sealr</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                GitHub
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Docs
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Discord
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Profile Setup Modal */}
      <ProfileSetupModal isOpen={showProfileSetup} onClose={() => setShowProfileSetup(false)} />

      {/* Loading overlay while checking profile/redirecting */}
      {isChecking && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <ClipLoader color="hsl(45 100% 85%)" loading={true} size={45} aria-label="Loading Spinner" />
            <p className="text-sm text-muted-foreground">Preparing your secure workspace…</p>
          </div>
        </div>
      )}
    </div>
  )
}
