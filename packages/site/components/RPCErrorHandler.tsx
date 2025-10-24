"use client"

import { useEffect } from "react"
import { useProvider } from "wagmi"

interface RPCErrorHandlerProps {
  children: React.ReactNode
}

/**
 * Global RPC error handler component that wraps the entire app
 * to catch and handle eth_getFilterChanges errors at the provider level
 */
export function RPCErrorHandler({ children }: RPCErrorHandlerProps) {
  const provider = useProvider()

  useEffect(() => {
    if (!provider) return

    // Store original methods
    const originalRequest = provider.request
    const originalSend = (provider as any).send

    // Wrap the request method to handle filter errors
    const wrappedRequest = async (args: any) => {
      try {
        return await originalRequest.call(provider, args)
      } catch (error: any) {
        // Handle specific RPC filter errors
        if (
          error?.message?.includes("eth_getFilterChanges") ||
          error?.message?.includes("filter not found") ||
          error?.message?.includes("Missing or invalid parameters") ||
          error?.code === -32000
        ) {
          console.warn("RPC Filter Error (handled gracefully):", error.message)
          // Return empty result for filter errors instead of throwing
          if (args.method === "eth_getFilterChanges") {
            return []
          }
          return null
        }
        throw error
      }
    }

    // Wrap the send method if it exists
    const wrappedSend = async (args: any, callback: any) => {
      try {
        if (originalSend) {
          return await originalSend.call(provider, args, callback)
        }
      } catch (error: any) {
        if (
          error?.message?.includes("eth_getFilterChanges") ||
          error?.message?.includes("filter not found") ||
          error?.message?.includes("Missing or invalid parameters") ||
          error?.code === -32000
        ) {
          console.warn("RPC Filter Error (handled gracefully):", error.message)
          if (args.method === "eth_getFilterChanges") {
            callback(null, { result: [] })
            return
          }
          callback(null, { result: null })
          return
        }
        throw error
      }
    }

    // Apply the wrapped methods
    ;(provider as any).request = wrappedRequest
    if (originalSend) {
      ;(provider as any).send = wrappedSend
    }

    // Cleanup on unmount
    return () => {
      ;(provider as any).request = originalRequest
      if (originalSend) {
        ;(provider as any).send = originalSend
      }
    }
  }, [provider])

  return <>{children}</>
}
