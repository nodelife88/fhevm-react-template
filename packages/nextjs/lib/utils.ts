import { ethers } from "ethers"

export function toHex0x(value: Uint8Array | string): `0x${string}` {
  if (typeof value === "string") {
    return (value.startsWith("0x") ? (value as `0x${string}`) : ("0x" + value as `0x${string}`))
  }
  return ("0x" + Buffer.from(value).toString("hex")) as `0x${string}`
}

export function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address)
    return true
  } catch {
    return false
  }
}

export function normalizeAddress(address: string): string {
  return ethers.getAddress(address.trim())
}
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
