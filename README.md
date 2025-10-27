# Confidential Chat

[![License](https://img.shields.io/badge/license-BSD--3--Clause--Clear-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](package.json)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sealr-zama.vercel.app)

A fully on-chain, end-to-end encrypted messaging dApp powered by **Zama's FHEVM** (Fully Homomorphic Encryption Virtual Machine). This application enables confidential conversations with complete privacy, where message content remains encrypted even on a public blockchain.

🌐 **[Try Live Demo →](https://sealr-zama.vercel.app)**
## 🌟 Features

### Core Messaging
- **🔐 End-to-End Encryption**: All messages are encrypted using Fully Homomorphic Encryption (FHE)
- **👥 Direct Messaging**: Private one-on-one conversations with any user
- **👨‍👩‍👧‍👦 Group Conversations**: Secure group chats with multiple participants
- **💬 Message Reactions**: Add encrypted reactions to messages
- **🗑️ Soft Deletion**: Remove conversations while maintaining privacy
- **👤 User Profiles**: Create profiles with names and avatars

### Privacy & Security
- **🔒 Zero-Knowledge Storage**: Message content is never decrypted on-chain
- **🔐 Access Control**: Only authorized conversation members can decrypt messages
- **📝 EIP-712 Authentication**: Secure authorization for decryption requests
- **🌐 On-Chain Storage**: No reliance on external storage (IPFS, centralized servers)

### User Experience
- **✨ Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- **🎨 Custom SDK**: React hooks and utilities for seamless FHEVM integration
- **⚡ Real-time Updates**: Live message synchronization across devices
- **🎯 TypeScript**: Fully typed for better developer experience

## 📋 Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)
- [Support](#support)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **pnpm**: Package manager (or npm/yarn)
- **MetaMask**: Browser extension for wallet integration

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/nodelife88/confidential-chat
cd confidential-chat
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Build the SDK**

The SDK will be built automatically during installation:

```bash
pnpm sdk:build
```

### Running the Application

#### Option 1: Local Development

1. **Start Hardhat node** (in a separate terminal)

```bash
pnpm chain
```

2. **Deploy contracts to local network**

```bash
pnpm deploy:localhost
```

This will:
- Deploy `ConfidentialMessenger.sol` to localhost
- Generate TypeScript bindings
- Save contract addresses

3. **Add Hardhat network to MetaMask**

```
Name: Hardhat
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

4. **Start the frontend**

```bash
pnpm start
```

Visit `http://localhost:3000` to access the application.

#### Option 2: Sepolia Testnet

1. **Set up environment variables**

```bash
cd packages/fhevm-hardhat-template
npx hardhat vars set MNEMONIC
npx hardhat vars set RPC_URL
```

2. **Deploy to Sepolia**

```bash
pnpm deploy:sepolia
```

3. **Get testnet ETH**

Request Sepolia ETH from [Alchemy Faucet](https://sepoliafaucet.com/) or [Coinbase Faucet](https://www.coinbase.com/faucets/ethereum-sepolia-faucet)

4. **Start the frontend**

```bash
pnpm start
```

## 📁 Project Structure

This is a monorepo managed with pnpm workspaces:

```
confidential-chat/
├── packages/
│   ├── fhevm-hardhat-template/    # Smart contract development
│   │   ├── contracts/
│   │   │   └── ConfidentialMessenger.sol
│   │   ├── deploy/
│   │   ├── test/
│   │   └── hardhat.config.ts
│   │
│   ├── fhevm-sdk/                   # Custom FHEVM SDK
│   │   ├── src/
│   │   │   ├── core/               # Core FHE operations
│   │   │   ├── react/              # React hooks
│   │   │   └── storage/            # Storage utilities
│   │   └── dist/                   # Built output
│   │
│   └── site/                        # Next.js frontend
│       ├── app/                    # App Router pages
│       ├── components/             # React components
│       ├── hooks/                  # Custom hooks
│       ├── services/               # Business logic
│       ├── store/                  # Zustand stores
│       └── abi/                    # Contract ABIs
│
├── scripts/
│   └── generateTsAbis.ts          # ABI generation script
│
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity**: ^0.8.24
- **@fhevm/solidity**: FHE cryptographic operations
- **Hardhat**: Development environment and testing
- **TypeChain**: TypeScript bindings generation
- **hardhat-deploy**: Automated deployment system

### Frontend
- **Next.js**: ^15.2.4 (App Router)
- **React**: ^19.2.0
- **TypeScript**: ^5.9.2
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **Wagmi + Viem**: Ethereum integration
- **RainbowKit**: Wallet connection UI
- **Zustand**: State management

### Cryptography
- **@zama-fhe/relayer-sdk**: FHE relayer integration
- **FHEVM**: Fully Homomorphic Encryption Virtual Machine
- **EIP-712**: Signing standard for authorization

## 🏗️ Architecture

### Overview

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │      │   Wallet    │      │   Relayer   │
│  (Frontend) │◄────►│  (MetaMask) │◄────►│  (Zama)     │
└──────┬──────┘      └─────────────┘      └─────────────┘
       │                                          ▲
       │ 1. Encrypt (SDK)                         │
       │ 2. Sign Transaction (Wallet)             │ 4. Decrypt Request
       │                                          │
       ▼                                          │
    ┌───────────────────────────────────────────────┐
    │          Ethereum Network                     │
    │  ┌────────────────────────────────────────┐   │
    │  │   ConfidentialMessenger.sol            │   │
    │  │   - Store encrypted data               │   │
    │  │   - Access control (FHE.allow)         │   │
    │  │   - FHE operations                     │   │
    │  └────────────────────────────────────────┘   │
    └───────────────────────────────────────────────┘
```

### Data Flow

1. **Encryption**: Frontend uses `@zama-fhe/relayer-sdk` to encrypt message content
2. **Transaction**: User signs transaction with wallet to send encrypted data
3. **Storage**: Smart contract stores ciphertext on-chain
4. **Access Control**: Contract grants decryption permissions to authorized users via `FHE.allow`
5. **Decryption**: Relayer decrypts messages for authorized users upon request
6. **Display**: Frontend displays decrypted messages to users

### Important Notes

⚠️ **Nonce Mismatch Error**: If you restart the Hardhat node, clear MetaMask activity:
- MetaMask → Settings → Advanced → Clear Activity Tab

⚠️ **View Function Cache**: If seeing stale data:
- Restart your browser completely

## 📝 Deployment

### Mainnet Deployment

1. **Prepare environment**:
   ```bash
   cd packages/fhevm-hardhat-template
   npx hardhat vars set MNEMONIC
   npx hardhat vars set RPC_URL
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

2. **Deploy to mainnet**:
   ```bash
   npx hardhat deploy --network mainnet
   ```

3. **Verify contract**:
   ```bash
   npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
   ```

## 🗺️ Roadmap

### ✅ Completed

- [x] Core messaging functionality
- [x] User profiles and authentication
- [x] Direct and group conversations
- [x] Encrypted message storage
- [x] Message reactions
- [x] Modern UI/UX
- [x] Custom FHEVM SDK

### 🔄 In Progress

- [ ] Read receipts
- [ ] Message quoting
- [ ] Public disclosure mechanism
- [ ] Batch encryption/decryption

### 📅 Planned

- [ ] Search functionality
- [ ] Message attachments
- [ ] Real-time notifications
- [ ] Mobile optimization
- [ ] TheGraph integration for indexing

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama**: For the FHEVM protocol and comprehensive documentation
- **Hardhat**: For the excellent development environment
- **Next.js**: For the powerful React framework
- **RainbowKit & Wagmi**: For seamless Web3 integration

## 📚 Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [Relayer SDK Guide](https://docs.zama.ai/protocol/relayer-sdk-guides/)
- [Next.js Documentation](https://nextjs.org/docs)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Wagmi Documentation](https://wagmi.sh/)

## 🆘 Support

- **Discord**: [Zama Community](https://discord.com/invite/zama)
- **GitHub Issues**: Report bugs or request features
- **Documentation**: [docs.zama.ai](https://docs.zama.ai)

---

**Built with ❤️ using [FHEVM](https://github.com/zama-ai/fhevm) by Zama**
