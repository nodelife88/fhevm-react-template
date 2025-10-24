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
    console.log('useRainbowKitEthersSigner - checking conditions:', {
      hasWalletClient: !!walletClient,
      isConnected,
      address,
      walletClientType: typeof walletClient
    })

    if (walletClient && isConnected && address) {
      const setup = async () => {
        try {
          console.log('Creating ethers signer...')
          const eip1193 = walletClient.transport
          const browserProvider = new ethers.BrowserProvider(eip1193 as any)

          // Ensure there is at least one authorized account before attempting getSigner
          let accounts: string[] = []
          try {
            // Prefer listAccounts when available
            accounts = (await browserProvider.listAccounts()).map((a) => a.address)
          } catch (_) {
            try {
              accounts = await (browserProvider as any).send?.('eth_accounts', [])
            } catch (innerError) {
              console.warn('Unable to query accounts before getSigner', innerError)
            }
          }

          if (!accounts || accounts.length === 0) {
            console.log('No authorized accounts; skipping signer setup')
            setEthersSigner(undefined)
            setProvider(undefined)
            setEip1193Provider(undefined)
            return
          }

          const normalized = address.toLowerCase()
          const hasRequestedAddress = accounts.some((a) => a?.toLowerCase?.() === normalized)
          if (!hasRequestedAddress) {
            console.log('Connected address not present in provider accounts; skipping signer setup')
            setEthersSigner(undefined)
            setProvider(undefined)
            setEip1193Provider(undefined)
            return
          }

          const signer = await browserProvider.getSigner(address)
          console.log('Ethers signer created successfully:', !!signer)
          setEthersSigner(signer)
          setProvider(browserProvider)
          setEip1193Provider(eip1193)
        } catch (error: any) {
          // Handle common user-rejection / provider coalescing issues without crashing the app
          const code = error?.code
          if (code === 4001 || code === -32001) {
            console.warn('User rejected request or provider returned unknown error; clearing signer state', error)
          } else {
            console.error('Error creating ethers signer:', error)
          }
          setEthersSigner(undefined)
          setProvider(undefined)
          setEip1193Provider(undefined)
        }
      }
      setup()
    } else {
      console.log('Clearing ethers signer - missing dependencies')
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
