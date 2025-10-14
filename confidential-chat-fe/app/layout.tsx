import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Web3Provider } from "@/lib/web3-context"
import { InMemoryStorageProvider } from "@/lib/fhevm-sdk/src/react/useInMemoryStorage"
import "./globals.css"

export const metadata: Metadata = {
  title: "FHEVM Messenger - Confidential On-Chain Messaging",
  description: "End-to-end encrypted messaging powered by FHEVM",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body 
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
        suppressHydrationWarning={true}
      >
        <Web3Provider>
          <InMemoryStorageProvider>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </InMemoryStorageProvider>
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}
