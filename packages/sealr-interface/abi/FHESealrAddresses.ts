export type SealrChainInfo = {
  address: string;
  chainId: number;
  chainName: string;
};

export const FHESealrAddresses: Record<string, SealrChainInfo> = {
  "11155111": {
    address: "0x841218717Cd49278C86Cd3931e1c0D28703e545D",
    chainId: 11155111,
    chainName: "sepolia",
  }
};
