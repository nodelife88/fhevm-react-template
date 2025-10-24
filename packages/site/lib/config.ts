// Configuration for WebSocket and HTTP providers
export const RPC_CONFIG = {
  // WebSocket URLs for better event listening (no filter issues)
  SEPOLIA_WS_URL: process.env.NEXT_PUBLIC_SEPOLIA_WS_URL || "wss://ethereum-sepolia-rpc.publicnode.com",
  SEPOLIA_HTTP_URL: process.env.NEXT_PUBLIC_SEPOLIA_RPC_ENDPOINT || "https://ethereum-sepolia-rpc.publicnode.com",
  
  // Alternative WebSocket providers (if primary is not available)
  ALTERNATIVE_WS_URLS: [
    "wss://ethereum-sepolia-rpc.publicnode.com", // Primary (tested working)
    "wss://sepolia.infura.io/ws/v3/demo",
    "wss://sepolia.gateway.tenderly.co",
    "wss://sepolia.drpc.org",
  ],
  
  // Polling configuration
  POLLING_INTERVAL: 4000, // 4 seconds
  BLOCK_RANGE: 100, // Check last 100 blocks
};

// Helper function to get the best available WebSocket URL
export function getBestWebSocketUrl(): string {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_SEPOLIA_WS_URL) {
    console.log("Using WebSocket URL from env:", process.env.NEXT_PUBLIC_SEPOLIA_WS_URL);
    return process.env.NEXT_PUBLIC_SEPOLIA_WS_URL;
  }
  
  // Default to PublicNode (tested working)
  console.log("Using default WebSocket URL:", RPC_CONFIG.SEPOLIA_WS_URL);
  return RPC_CONFIG.SEPOLIA_WS_URL;
}
