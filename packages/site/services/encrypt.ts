import { FhevmInstance } from "@fhevm-sdk";
import { stringToBigInts, stringToBigInt } from "@/utils";
import { ethers } from "ethers";

// Cache for signatures to avoid recreating them
const signatureCache = new Map<string, any>();

/**
 * Encrypts a UTF-8 string into batches of ciphertexts and proofs
 * for secure submission to an FHE-enabled smart contract.
 *
 * Process:
 * 1. Converts the input string into an array of bigint chunks.
 * 2. Splits the array into batches (up to 8 bigints each).
 * 3. For each batch:
 *    - Creates an encrypted input bound to the contract and signer.
 *    - Adds all bigints in the batch to the input.
 *    - Encrypts the input, producing ciphertext handles and a proof.
 *    - Collects all ciphertexts and corresponding proofs.
 *
 * @param {string} contractAddress - Target contract address.
 * @param {FhevmInstance} fheInstance - The FHE VM instance used for encryption.
 * @param {ethers.Signer} signer - The signer, used to bind encryption to an address.
 * @param {string} str - The input string to encrypt.
 * @returns {Promise<{ ciphertexts: Uint8Array[]; proofs: Uint8Array[] }>}
 *          A Promise resolving to an object containing all ciphertexts and proofs.
 */
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

  // Process batches in parallel for better performance
  const batches: bigint[][] = [];
  for (let i = 0; i < bigints.length; i += BATCH_SIZE) {
    batches.push(bigints.slice(i, i + BATCH_SIZE));
  }

  // Process all batches in parallel
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

/**
 * Encrypts a string into a ciphertext and proof,
 * bound to a target FHE-enabled smart contract and signer.
 *
 * @param {string} contractAddress - Target contract address.
 * @param {FhevmInstance} fheInstance - The FHE VM instance used for encryption.
 * @param {ethers.Signer} signer - The signer, used to bind encryption to an address.
 * @param {string} value - The string value to encrypt.
 * @returns {Promise<{ciphertext: Uint8Array; proof: Uint8Array}>}
 */
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
