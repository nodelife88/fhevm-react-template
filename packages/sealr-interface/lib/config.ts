export const RPC_CONFIG = {
  SEPOLIA_WS_URL: process.env.NEXT_PUBLIC_SEPOLIA_WS_URL || "wss://ethereum-sepolia-rpc.publicnode.com",
  
  ALTERNATIVE_WS_URLS: [
    "wss://ethereum-sepolia-rpc.publicnode.com", 
    "wss://sepolia.infura.io/ws/v3/demo",
    "wss://sepolia.gateway.tenderly.co",
    "wss://sepolia.drpc.org",
  ],
  
  POLLING_INTERVAL: 4000, 
  BLOCK_RANGE: 100, 
};

export function getBestWebSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SEPOLIA_WS_URL) {
    return process.env.NEXT_PUBLIC_SEPOLIA_WS_URL;
  }
  
  return RPC_CONFIG.SEPOLIA_WS_URL;
}
