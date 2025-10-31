import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "./providers"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Sealr - Confidential On-Chain Messaging",
  description: "End-to-end encrypted messaging powered by FHEVM",
  generator: "Sealr",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/sealr.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans h-screen text-foreground antialiased`}
        suppressHydrationWarning={true}
      >
        <main className="h-full w-full flex flex-col">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  )
}
