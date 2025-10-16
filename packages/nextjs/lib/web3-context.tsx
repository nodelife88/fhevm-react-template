"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Web3ContextType {
  address: string | null
  isConnected: boolean
  chainId: number | null
  connect: (walletType: string) => Promise<void>
  disconnect: () => void
  switchNetwork: (chainId: number) => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check if already connected
    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          setChainId(Number.parseInt(chainId, 16))
        }
      } catch (error) {
        console.error("[v0] Error checking connection:", error)
      }
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAddress(accounts[0])
      setIsConnected(true)
    } else {
      setAddress(null)
      setIsConnected(false)
    }
  }

  const handleChainChanged = (chainId: string) => {
    setChainId(Number.parseInt(chainId, 16))
    window.location.reload()
  }

  const connect = async (walletType: string) => {
    if (typeof window === "undefined") return

    try {
      if (walletType === "metamask" && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })
        setAddress(accounts[0])
        setIsConnected(true)
        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        setChainId(Number.parseInt(chainId, 16))
      }
      // Add other wallet types here (WalletConnect, Coinbase, etc.)
    } catch (error) {
      console.error("[v0] Error connecting wallet:", error)
      throw error
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    setChainId(null)
  }

  const switchNetwork = async (targetChainId: number) => {
    if (typeof window === "undefined" || !window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        console.error("[v0] Network not added to wallet")
      }
      throw error
    }
  }

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected,
        chainId,
        connect,
        disconnect,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}

declare global {
  interface Window {
    ethereum?: any
  }
}
