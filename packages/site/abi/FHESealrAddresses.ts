export type SealrChainInfo = {
  address: string;
  chainId: number;
  chainName: string;
};

export const FHESealrAddresses: Record<string, SealrChainInfo> = {
  "11155111": {
    address: "0x76dd5b0881944B39206230227ebcf0E00dd425b7",
    chainId: 11155111,
    chainName: "sepolia",
  }
};
