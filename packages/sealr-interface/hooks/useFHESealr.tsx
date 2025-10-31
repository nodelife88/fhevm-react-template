import { useEffect } from "react";
import { ethers } from "ethers";
import { FHESealrABI } from "@/abi/FHESealrABI";
import { FHESealrAddresses } from "@/abi/FHESealrAddresses";

import { useFhevm } from "@fhevm-sdk";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFHESealrStore } from "@/store/useFHESealrStore";
import { useRainbowKitEthersSigner } from "@/hooks/useRainbowKitEthersSigner";

export const useFheInstance = () => {
  const { storage } = useInMemoryStorage();
  const { eip1193Provider, chainId } = useRainbowKitEthersSigner();
  const { fhevmIsReady ,setFhevmIsReady, setFheInstance, setFhevmDecryptionSignatureStorage } = useFHESealrStore();
  

  const { instance, status } = useFhevm({
    provider: eip1193Provider as any,
    chainId,
    enabled: !!eip1193Provider && !!chainId,
  });


  useEffect(() => {
    if (status === "ready" && !fhevmIsReady && instance) {
      setFhevmDecryptionSignatureStorage(storage)
      setFheInstance(instance);
      setFhevmIsReady(true);
    }
  }, [status, instance, fhevmIsReady, storage, setFhevmDecryptionSignatureStorage, setFheInstance, setFhevmIsReady]);
};

export const useFHESealrContracts = () => {
  const { chainId, ethersSigner } = useRainbowKitEthersSigner();
  const { contractAddress, setContractAddress, setContracts, setContractIsReady } = useFHESealrStore();

  useEffect(() => {
    if (chainId) {
      const address = FHESealrAddresses[String(chainId)]?.address ?? "";
      setContractAddress(address);
    } else {
      setContractAddress("");
    }
  }, [chainId, setContractAddress]);

  useEffect(() => {
    if (chainId && ethersSigner && contractAddress) {
      try {
        const contractTx = new ethers.Contract(
          contractAddress,
          FHESealrABI.abi,
          ethersSigner
        );
        
        const contractView = new ethers.Contract(
          contractAddress,
          FHESealrABI.abi,
          ethersSigner.provider
        );
        
        setContracts(contractTx, contractView);
        setContractIsReady(true);
      } catch (error) {
        console.error('Error initializing contracts:', error);
        setContractIsReady(false);
      }
    } else {
      setContractIsReady(false);
    }
  }, [chainId, ethersSigner, contractAddress, setContracts, setContractIsReady]);
};
