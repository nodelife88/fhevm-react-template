export type SealrChainInfo = {
  address: string;
  chainId: number;
  chainName: string;
};

export const FHESealrAddresses: Record<string, SealrChainInfo> = {
  "11155111": {
    address: "0x5e13F97A9Bb120FF32F1CD329d6f2CE71734aCa6",
    chainId: 11155111,
    chainName: "sepolia",
  }
};
