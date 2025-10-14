"use client"

import { useState, useMemo } from "react"
import { useWeb3 } from "@/lib/web3-context"
import { useFhevm, useFHEDecrypt, useFHEEncryption, useInMemoryStorage } from "@/lib/fhevm-sdk"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export function FhevmDemo() {
  const { address, isConnected, chainId } = useWeb3()
  const [message, setMessage] = useState("")
  const [encryptedMessage, setEncryptedMessage] = useState("")
  const [decryptedMessage, setDecryptedMessage] = useState("")
  const [status, setStatus] = useState("")

  // FHEVM instance
  const provider = useMemo(() => {
    if (typeof window === "undefined") return undefined
    return window.ethereum
  }, [])

  const initialMockChains = { 31337: "http://localhost:8545" }

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  })

  // Storage for decryption signatures
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage()

  // Encryption hook
  const { encryptWith } = useFHEEncryption({ 
    instance: fhevmInstance, 
    ethersSigner: undefined, // Would be passed from wallet
    contractAddress: "0x663F72147269D638ED869f05C0B4C62008826a6b" as `0x${string}`
  })

  // Decryption requests
  const requests = useMemo(() => {
    if (!encryptedMessage) return undefined
    return [{ handle: encryptedMessage, contractAddress: "0x663F72147269D638ED869f05C0B4C62008826a6b" as `0x${string}` }] as const
  }, [encryptedMessage])

  const {
    canDecrypt,
    decrypt,
    isDecrypting,
    message: decMsg,
    results,
  } = useFHEDecrypt({
    instance: fhevmInstance,
    ethersSigner: undefined, // Would be passed from wallet
    fhevmDecryptionSignatureStorage,
    chainId,
    requests,
  })

  const handleEncrypt = async () => {
    if (!message) return
    
    setStatus("Encrypting...")
    try {
      if (encryptWith) {
        const enc = await encryptWith(builder => {
          builder.add32(message.length)
        })
        if (enc) {
          setEncryptedMessage(`0x${Buffer.from(enc.handles[0]).toString('hex')}`)
          setStatus("Encryption completed")
        }
      } else {
        setStatus("Encryption not available")
      }
    } catch (error) {
      setStatus(`Encryption failed: ${error}`)
    }
  }

  const handleDecrypt = async () => {
    if (!canDecrypt) return
    
    setStatus("Decrypting...")
    try {
      await decrypt()
      if (results[encryptedMessage]) {
        setDecryptedMessage(results[encryptedMessage].toString())
        setStatus("Decryption completed")
      }
    } catch (error) {
      setStatus(`Decryption failed: ${error}`)
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>FHEVM Demo</CardTitle>
          <CardDescription>Connect your wallet to use FHEVM encryption/decryption</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please connect your wallet to use the FHEVM demo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>FHEVM SDK Demo</CardTitle>
          <CardDescription>
            Test FHEVM encryption and decryption with ConfidentialMessenger contract
          </CardDescription>
          <div className="flex gap-2">
            <Badge variant="outline">Connected: {address}</Badge>
            <Badge variant="outline">Chain: {chainId}</Badge>
            <Badge variant={fhevmStatus === "ready" ? "default" : "secondary"}>
              FHEVM: {fhevmStatus}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {fhevmError && (
        <Alert variant="destructive">
          <AlertDescription>
            FHEVM Error: {fhevmError.message}
          </AlertDescription>
        </Alert>
      )}

      {status && (
        <Alert>
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Encryption */}
        <Card>
          <CardHeader>
            <CardTitle>🔐 Encryption</CardTitle>
            <CardDescription>Encrypt a message using FHEVM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter message to encrypt"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button 
              onClick={handleEncrypt} 
              disabled={!message || !fhevmInstance}
              className="w-full"
            >
              Encrypt Message
            </Button>
            {encryptedMessage && (
              <div className="p-3 bg-gray-100 rounded text-sm">
                <strong>Encrypted:</strong> {encryptedMessage}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decryption */}
        <Card>
          <CardHeader>
            <CardTitle>🔓 Decryption</CardTitle>
            <CardDescription>Decrypt an encrypted message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleDecrypt} 
              disabled={!canDecrypt || isDecrypting}
              className="w-full"
            >
              {isDecrypting ? "Decrypting..." : "Decrypt Message"}
            </Button>
            {decryptedMessage && (
              <div className="p-3 bg-gray-100 rounded text-sm">
                <strong>Decrypted:</strong> {decryptedMessage}
              </div>
            )}
            {decMsg && (
              <div className="p-3 bg-blue-100 rounded text-sm">
                <strong>Status:</strong> {decMsg}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FHEVM Instance Status */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 FHEVM Instance Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 px-3 bg-white border border-gray-200 rounded">
            <span className="font-medium">Instance Status</span>
            <Badge variant={fhevmInstance ? "default" : "secondary"}>
              {fhevmInstance ? "✅ Connected" : "❌ Disconnected"}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-white border border-gray-200 rounded">
            <span className="font-medium">Status</span>
            <span className="font-mono text-sm">{fhevmStatus}</span>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-white border border-gray-200 rounded">
            <span className="font-medium">Can Encrypt</span>
            <Badge variant={encryptWith ? "default" : "secondary"}>
              {encryptWith ? "✅ Yes" : "❌ No"}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-white border border-gray-200 rounded">
            <span className="font-medium">Can Decrypt</span>
            <Badge variant={canDecrypt ? "default" : "secondary"}>
              {canDecrypt ? "✅ Yes" : "❌ No"}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2 px-3 bg-white border border-gray-200 rounded">
            <span className="font-medium">Is Decrypting</span>
            <Badge variant={isDecrypting ? "default" : "secondary"}>
              {isDecrypting ? "⏳ Yes" : "❌ No"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
