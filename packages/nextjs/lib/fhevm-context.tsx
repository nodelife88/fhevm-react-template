"use client"

import React, { createContext, useContext, useMemo } from "react"
import { useFhevm } from "@/lib/fhevm-sdk"
import { useWeb3 } from "@/lib/web3-context"

type FhevmContextValue = {
  instance: any | undefined
  status: "idle" | "loading" | "ready" | "error"
  error: Error | undefined
}

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined)

export function FhevmProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, chainId } = useWeb3()
  const { instance, status, error } = useFhevm({ provider: typeof window !== "undefined" ? (window as any).ethereum : undefined, chainId: chainId ?? undefined, enabled: isConnected })

  const value = useMemo(() => ({ instance, status, error }), [instance, status, error])
  return <FhevmContext.Provider value={value}>{children}</FhevmContext.Provider>
}

export function useFhevmContext(): FhevmContextValue {
  const ctx = useContext(FhevmContext)
  if (!ctx) throw new Error("useFhevmContext must be used within FhevmProvider")
  return ctx
}


