"use client"

import { useEffect, useState } from "react"
import { useAccount, useWalletClient, useConfig } from "wagmi"
import { ethers } from "ethers"

export const useRainbowKitEthersSigner = () => {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const config = useConfig()
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined)
  const [provider, setProvider] = useState<ethers.BrowserProvider | undefined>(undefined)
  const [eip1193Provider, setEip1193Provider] = useState<any>(undefined)
  const chainId = config.chains[0]?.id || 11155111

  useEffect(() => {
    if (walletClient && isConnected && address) {
      const setup = async () => {
        try {
          const eip1193 = walletClient.transport
          const browserProvider = new ethers.BrowserProvider(eip1193 as any)

          let accounts: string[] = []
          try {
            accounts = (await browserProvider.listAccounts()).map((a) => a.address)
          } catch (_) {
            try {
              accounts = await (browserProvider as any).send?.('eth_accounts', [])
            } catch (innerError) {
              // Silent failure
            }
          }

          if (!accounts || accounts.length === 0) {
            setEthersSigner(undefined)
            setProvider(undefined)
            setEip1193Provider(undefined)
            return
          }

          const normalized = address.toLowerCase()
          const hasRequestedAddress = accounts.some((a) => a?.toLowerCase?.() === normalized)
          if (!hasRequestedAddress) {
            setEthersSigner(undefined)
            setProvider(undefined)
            setEip1193Provider(undefined)
            return
          }

          const signer = await browserProvider.getSigner(address)
          setEthersSigner(signer)
          setProvider(browserProvider)
          setEip1193Provider(eip1193)
        } catch (error: any) {  
          setEthersSigner(undefined)
          setProvider(undefined)
          setEip1193Provider(undefined)
        }
      }
      setup()
    } else {
      setEthersSigner(undefined)
      setProvider(undefined)
      setEip1193Provider(undefined)
    }
  }, [walletClient, isConnected, address])

  return {
    ethersSigner,
    provider,
    eip1193Provider,
    chainId,
    address,
    isConnected,
  }
}
