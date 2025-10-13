# Confidential Messaging dApp with FHEVM

A fully on-chain, end-to-end encrypted messaging application using Fully Homomorphic Encryption (FHE) powered by Zama's FHEVM.

This dApp enables private chat between users or within DAOs, supporting complex message logic (e.g., read receipts, quotes, group access) while keeping content confidential.

---

## ✨ Features

### ✉️ Private Messaging

* **Encrypted Messages**: Messages are encrypted using FHE and stored on-chain.
* **Sender/Receiver Privacy**: Message content is visible only to sender and recipient.
* **Message Read Status**: `isRead` flag is stored as an `ebool`.
* **Message Quoting**: Messages can quote other messages using `quotedMsgId`.
* **Soft Deletion**: Messages can be marked as deleted (e.g., `isDeleted` field).

### 🧳 DAO/Group Messaging

* **DAO Channels**: Encrypted group messages within DAO-specific channels.
* **Confidential Discussion**: Only members can decrypt and participate.
* **Public Disclosure Option**: After a timeout or DAO vote, messages can be made publicly decryptable (using FHEVM publicization helpers).

### 🔒 Access Control & Security

* **Per-User Access**: Messages decrypted only by permitted users using `FHE.allow`.
* **Decryption Token**: EIP-712 signed token allows frontend to request decryption from relayer.
* **Quote Verification**: Quoted messages can be verified for authenticity via encrypted hash references.

### 📅 Metadata Management

* **Timestamps**: Encrypted or plain, depending on use-case.
* **Sender/Receiver**: Optionally encrypted addresses (`eaddress`).
* **Sorting and Filtering**: Based on decrypted metadata or public info.

---

## ⚖️ Contract Data Structures (Sample)

```solidity
struct EncryptedMessage {
    address sender;
    address receiver;
    bytes contentCiphertext; // ciphertext stored on-chain; decrypted off-chain when authorized
    ebool isRead;
    euint64 quotedMsgId;
    bool isDeleted;
    bool isPublic;
    uint256 timestamp;
    string channel; // For group/DAO messages
}
```

---

## 🚀 Deployment Plan

🔧 Phase 1: Core Private Messaging

Goal: Allow users to send and receive fully private 1:1 messages with basic FHE logic.

Tasks:

Create `ConfidentialMessenger.sol` smart contract:

- Define `EncryptedMessage` and `mapping(uint256 => EncryptedMessage) messages` with incremental `msgId` counter
- Implement `sendMessage(...)` to accept encrypted inputs from the frontend/relayer
- Implement `markAsRead(msgId)` using `FHE.select` to update `isRead`

Integrate Relayer SDK on the frontend:

- Prepare encrypted inputs for contract calls via the SDK
- Use an EIP-712 signed authorization to request decryption from the relayer for permitted users

Simple UI:

- Compose/send, list, and display messages; decrypt per recipient when authorized

🏛️ Phase 2: DAO Chat & Public Disclosure

Goal: Enable private group discussions within a DAO and optional publicization after a vote.

Tasks:

- Add `channel` field and a mapping for DAO members
- Implement `sendToChannel(...)` with membership checks
- Implement `makeMessagePublic(msgId)` leveraging FHEVM publicization helpers (emit event for indexers/clients)
- Integrate DAO voting (e.g., OpenZeppelin Governor): ERC20 or NFT voting
- On quorum, call `makeMessagePublic`

🖥️ Phase 3: UI/UX Enhancements

Goal: Improve UX with a modern, readable interface.

Tasks:

- Inbox / Outbox / Threads UI
- Show read/unread, quoting, nested replies
- View entire DAO discussion logs after publicization

📈 Phase 4: Optimization & Scaling

Goal: Optimize for performance and scale for real-world usage.

Tasks:

- Batch encryption/decryption to reduce gas and network overhead
- Pagination for chat history
- Run an off-chain indexer for fast metadata display (TheGraph or custom service)
- Add send quotas or anti-spam mechanisms

---

## 🛠️ Tech Stack

* **Smart Contracts**: Solidity + `@fhevm/solidity/lib/FHE.sol`
* **Frontend**: React + ethers.js + `@zama-fhe/relayer-sdk`
* **Storage**: On-chain (no IPFS needed)
* **Wallets**: Metamask / WalletConnect

---

## 📌 Notes

* All computation on encrypted data uses symbolic FHE handles.
* Coprocessors handle heavy TFHE computation.
* No FHE operations are in `view` or `pure` functions.

---

## 🧭 Architecture Overview

- Wallet signs transactions and EIP-712 authorizations
- Frontend prepares encrypted inputs via Relayer SDK
- Relayer and coprocessor handle TFHE computation and decryption requests
- Contract stores ciphertexts and uses symbolic FHE handles for logic (e.g., `FHE.select`)
- Indexer listens to events for efficient UI rendering without accessing plaintext

---

## 📣 Events

Emit events to enable indexing and UI updates without decrypting content:

```solidity
event MessageSent(uint256 indexed msgId, address indexed sender, address indexed receiver, string channel, uint256 timestamp);
event MessageRead(uint256 indexed msgId);
event MessagePublicized(uint256 indexed msgId);
```

---

## 🗂️ Message IDs, Indexing, and Pagination

- Use an auto-incrementing `msgId` counter
- Store messages in `mapping(uint256 => EncryptedMessage) messages`
- Maintain per-user indices for pagination:
  - `mapping(address => uint256[]) inbox`
  - `mapping(address => uint256[]) outbox`
- For DAO channels, index by `channel` for efficient queries

---

## 🧪 Quickstart (Dev)

Contracts (example with Hardhat):

1. `npm install`
2. `npx hardhat compile`
3. `npx hardhat test`
4. `npx hardhat run scripts/deploy.ts --network <network>`

Frontend:

1. `cd frontend && npm install`
2. Set env vars for RPC, relayer URL, and EIP-712 domain
3. `npm run dev`

Relayer integration:

- Configure `@zama-fhe/relayer-sdk`
- Prepare encrypted inputs for contract calls
- Use EIP-712 signed authorizations for decryption requests

---

## 🔐 Security & Threat Model

- Relayer trust: restrict decryption to authorized recipients via EIP-712 authorizations
- Replay protection: include nonces, expirations, and chain IDs in EIP-712 domain
- Access control changes: define how `FHE.allow` is granted/revoked and how group membership affects historical messages
- Anti-spam: quotas, fees, or allowlists to deter abuse
- Data disclosure: `isPublic` and `MessagePublicized` events signal clients and indexers to allow public decryption

---

## 📊 Future Ideas

* AI moderator/chatbot (confidential input prompts)
* Message search with encrypted keyword index
* Confidential group voting within DAO channels
