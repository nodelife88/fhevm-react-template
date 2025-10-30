"use client"

import type React from "react"
import { useEffect, useRef, useCallback } from "react"
import { ClipLoader } from "react-spinners"

import ChatHeader from "@/components/chat/ChatHeader"
import ChatMessages from "@/components/chat/ChatMessages"
import ChatMessageInput from "@/components/chat/ChatMessageInput"
import ChatMessageHeader from "@/components/chat/ChatMessageHeader"
import ChatBotConversationList from "@/components/chat/ChatBotConversationList"
import ErrorBoundary from "@/components/ErrorBoundary"

import { useFheInstance, useFHESealrContracts } from "@/hooks/useFHESealr"
import { useFHESealrStore } from "@/store/useFHESealrStore"
import { useFHESealrConversationStore } from "@/store/useFHESealrConversationStore"
import { useFHESealrLoginStore } from "@/store/useFHESealrLoginStore"
import { MessageSquare, Sparkles } from "lucide-react"

const Chat: React.FC = () => {
  useFheInstance()
  useFHESealrContracts()
  const { contractTx, fhevmIsReady, contractIsReady } = useFHESealrStore()
  const { loading, conversations, activeConversation, fetchConversations } = useFHESealrConversationStore()
  const { profile, getProfile } = useFHESealrLoginStore()

  const hasInitialized = useRef(false)
  const lastProfileWallet = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (contractIsReady && !profile) {
      getProfile()
    }
  }, [contractIsReady, profile, getProfile])

  useEffect(() => {
    const shouldFetch =
      contractIsReady &&
      fhevmIsReady &&
      profile &&
      (!hasInitialized.current || lastProfileWallet.current !== profile?.wallet)

    if (shouldFetch) {
      hasInitialized.current = true
      lastProfileWallet.current = profile?.wallet
      fetchConversations()
    }
  }, [contractIsReady, fhevmIsReady, profile])

  const handleMessageSent = useCallback(async () => {
    try {
      if (conversations.length === 0) {
        await fetchConversations()
      }
    } catch (error) {
      console.error("Error handling MessageSent in chat page:", error)
    }
  }, [conversations.length, fetchConversations])

  useEffect(() => {
    if (!contractTx) return

    try {
      contractTx.on("MessageSent", handleMessageSent)
    } catch (error) {
      console.error("Error setting up MessageSent listener:", error)
    }

    return () => {
      try {
        contractTx.off("MessageSent", handleMessageSent)
      } catch (error) {
        console.error("Error removing MessageSent listener:", error)
      }
    }
  }, [contractTx, handleMessageSent])

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95">
        <ChatHeader />

        <div className="flex-1 flex overflow-hidden">
          {conversations.length > 0 && (
            <div className="w-80 border-r border-border/50 bg-card/30 backdrop-blur-md flex flex-col shadow-lg">
              <ChatBotConversationList />
            </div>
          )}

          <div className="flex-1 flex flex-col">
            {conversations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-6 max-w-md">
                  <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                    <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                      <MessageSquare className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">No conversations yet</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Start a secure, encrypted chat by searching for a user in the header above
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>All messages are end-to-end encrypted</span>
                  </div>
                </div>
              </div>
            ) : activeConversation === null ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-6 max-w-md">
                  <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                    <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                      <MessageSquare className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">Select a conversation</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Choose a conversation from the sidebar to start chatting securely
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-gradient-to-b from-background/50 to-background">
                <ChatMessageHeader />
                <div className="flex-1 overflow-hidden">
                  <ChatMessages />
                </div>
                <ChatMessageInput />
              </div>
            )}
          </div>
        </div>

        {(!fhevmIsReady || !contractIsReady || loading) && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6 bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-border shadow-2xl">
              <ClipLoader color="hsl(45 100% 85%)" loading={true} size={50} aria-label="Loading Spinner" />
              <div className="text-center space-y-2">
                <p className="text-base font-semibold text-foreground">
                  {!fhevmIsReady
                    ? "Initializing encryption..."
                    : !contractIsReady
                      ? "Connecting to contract..."
                      : "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground">Please wait a moment</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default Chat
