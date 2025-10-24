import { FhevmInstance } from "@fhevm-sdk";
import { stringToBigInts, stringToBigInt } from "@/utils";
import { ethers } from "ethers";

const signatureCache = new Map<string, any>();

export async function encryptChunksForContract(
  contractAddress: string,
  fheInstance: FhevmInstance,
  signer: ethers.Signer,
  str: string
): Promise<{ ciphertexts: Uint8Array[]; proofs: Uint8Array[] }> {
  const BATCH_SIZE = 8;
  const bigints = stringToBigInts(str);

  const ciphertexts: Uint8Array[] = [];
  const proofs: Uint8Array[] = [];

  const signerAddress = await signer.getAddress();

  const batches: bigint[][] = [];
  for (let i = 0; i < bigints.length; i += BATCH_SIZE) {
    batches.push(bigints.slice(i, i + BATCH_SIZE));
  }

  const batchPromises = batches.map(async (batch) => {
    const input = fheInstance.createEncryptedInput(
      contractAddress,
      signerAddress
    );

    for (const bn of batch) {
      input.add256(bn);
    }

    const { handles, inputProof } = await input.encrypt();
    return { handles, inputProof };
  });

  try {
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(({ handles, inputProof }) => {
      for (const handle of handles) {
        ciphertexts.push(handle);
        proofs.push(inputProof);
      }
    });
  } catch (error) {
    console.error('Error processing encryption batches:', error);
    throw error;
  }

  return { ciphertexts, proofs };
}


export async function encryptStringForContract(
  contractAddress: string,
  fheInstance: FhevmInstance,
  signer: ethers.Signer,
  value: string
): Promise<{ ciphertext: Uint8Array; proof: Uint8Array; }> {
  const signerAddress = await signer.getAddress();
  const bigintValue = stringToBigInt(value);

  const input = fheInstance.createEncryptedInput(contractAddress, signerAddress);
  input.add256(bigintValue);

  const { handles, inputProof } = await input.encrypt();

  return {
    ciphertext: handles?.[0],
    proof: inputProof,
  };
}
