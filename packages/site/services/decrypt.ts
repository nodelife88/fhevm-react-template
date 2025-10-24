import { FhevmInstance } from "@fhevm-sdk";

const conversationDecryptCache: Map<string, Map<string, string>> = new Map();

let __decryptDbPromise: Promise<any> | undefined = undefined;

async function getDecryptDB(): Promise<any> {
  if (typeof window === "undefined") return undefined;
  if (__decryptDbPromise) return __decryptDbPromise;
  
  try {
    const { openDB } = await import("idb");
    __decryptDbPromise = openDB("decrypt-cache", 1, {
      upgrade(db: any) {
        if (!db.objectStoreNames.contains("conversationCache")) {
          db.createObjectStore("conversationCache", { keyPath: "id" });
        }
      },
    });
    return __decryptDbPromise;
  } catch (error) {
    console.warn("Failed to initialize IndexedDB:", error);
    return undefined;
  }
}

async function loadConversationCache(conversationId: string): Promise<Map<string, string>> {
  try {
    const db = await getDecryptDB();
    if (!db) return new Map();
    const rec = await db.get("conversationCache", conversationId);
    if (!rec?.entries) return new Map();
    return new Map(rec.entries);
  } catch {
    return new Map();
  }
}

async function persistConversationCache(conversationId: string, cache: Map<string, string>): Promise<void> {
  try {
    const db = await getDecryptDB();
    if (!db) return;
    await db.put("conversationCache", {
      id: conversationId,
      entries: Array.from(cache.entries()),
      updatedAt: Date.now(),
    });
  } catch {
  }
}

export async function decryptHandles(
  fheInstance: FhevmInstance,
  handles: { handle: string; contractAddress: `0x${string}` }[],
  sig: {
    privateKey: string;
    publicKey: string;
    signature: string;
    contractAddresses: string[];
    userAddress: string;
    startTimestamp: number;
    durationDays: number;
  },
  conversationId?: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const cacheKey = conversationId || 'default';
  if (!conversationDecryptCache.has(cacheKey)) {
    const loaded = await loadConversationCache(cacheKey);
    conversationDecryptCache.set(cacheKey, loaded);
  }
  const conversationCache = conversationDecryptCache.get(cacheKey)!;
  const misses: { handle: string; contractAddress: `0x${string}` }[] = [];
  for (const h of handles) {
    const cached = conversationCache.get(h.handle);
    if (cached !== undefined) {
      results[h.handle] = cached;
    } else {
      misses.push(h);
    }
  }

  const BATCH_SIZE = 10;
  const batches: { handle: string; contractAddress: `0x${string}` }[][] = [];
  
  for (let i = 0; i < misses.length; i += BATCH_SIZE) {
    batches.push(misses.slice(i, i + BATCH_SIZE));
  }
  const batchPromises = batches.map(async (batch) => {
    const batchResults: Record<string, string> = {};
    
    for (const item of batch) {
      try {
        const decrypted = await fheInstance.userDecrypt(
          [item],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        Object.assign(batchResults, decrypted);
      } catch (error) {
        console.error(`Failed to decrypt handle ${item.handle}`, error);
      }
    }
    
    return batchResults;
  });

  try {
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(batchResult => {
      Object.entries(batchResult).forEach(([handle, plaintext]) => {
        conversationCache.set(handle, String(plaintext));
        results[handle] = String(plaintext);
      });
    });
    void persistConversationCache(cacheKey, conversationCache);
  } catch (error) {
    console.error('Error processing decryption batches:', error);
  }

  return results;
}
