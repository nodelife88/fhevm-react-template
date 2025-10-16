import { ethers } from "ethers"

export function extractMessageIdFromReceipt(receipt: any, abi: any[]): string | null {
  try {
    const logs = (receipt && receipt.logs ? (receipt.logs as any[]) : [])
    const iface = new ethers.Interface(abi as any)
    const eventFrag = iface.getEvent("MessageSent") as any
    const topic = eventFrag && eventFrag.topicHash ? (eventFrag.topicHash as string) : undefined
    if (!topic) return null
    const ev = logs.find((l: any) => (l && l.topics && l.topics[0] === topic)) as any | undefined
    const topic1 = ev && ev.topics ? ev.topics[1] : undefined
    return topic1 ? ethers.getBigInt(topic1).toString() : null
  } catch {
    return null
  }
}


