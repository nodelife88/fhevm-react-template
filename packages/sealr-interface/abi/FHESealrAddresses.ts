export type SealrChainInfo = {
  address: string;
  chainId: number;
  chainName: string;
};

export const FHESealrAddresses: Record<string, SealrChainInfo> = {
  "11155111": {
    address: "0xd624aCFe99F64DEd22e3e6c5286E5bD4cB411A58",
    chainId: 11155111,
    chainName: "sepolia",
  }
};
