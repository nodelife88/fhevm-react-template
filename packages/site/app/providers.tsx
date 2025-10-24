"use client"

import "@rainbow-me/rainbowkit/styles.css"

import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"

import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage"
import { config } from "@/lib/wagmi"

const queryClient = new QueryClient()

type Props = {
  children: ReactNode
}

export function Providers({ children }: Props) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en">
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
