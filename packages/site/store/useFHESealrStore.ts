import { create } from "zustand";
import { ethers } from "ethers";
import { type GenericStringStorage, FhevmInstance } from "@fhevm-sdk";

type FHESealrStore = {
  contractTx: ethers.Contract | null;
  contractView: ethers.Contract | null;
  contractAddress: string;
  contractIsReady: boolean;
  fhevmIsReady: boolean;
  fheInstance: FhevmInstance | null;
  fhevmDecryptionSignatureStorage: GenericStringStorage,

  setContracts: (tx: ethers.Contract, view: ethers.Contract) => void;
  setContractAddress: (address: string) => void;
  setContractIsReady: (ready: boolean) => void;
  setFhevmIsReady: (ready: boolean) => void;
  setFheInstance: (instance: FhevmInstance) => void;
  setFhevmDecryptionSignatureStorage: (instance: GenericStringStorage) => void;
};

export const useFHESealrStore = create<FHESealrStore>((set, get) => ({
  contractTx: null,
  contractView: null,
  contractAddress: "",
  contractIsReady: false,
  fhevmIsReady: false,
  fheInstance: null,
  fhevmDecryptionSignatureStorage: {} as GenericStringStorage,

  setContracts: (tx, view) => set({ contractTx: tx, contractView: view }),
  setContractAddress: (address) => set({ contractAddress: address }),
  setContractIsReady: (ready) => set({ contractIsReady: ready }),
  setFhevmIsReady: (ready) => set({ fhevmIsReady: ready }),
  setFheInstance: (instance) => set({ fheInstance: instance }),
  setFhevmDecryptionSignatureStorage: (storage) => set({ fhevmDecryptionSignatureStorage: storage }),
}));
