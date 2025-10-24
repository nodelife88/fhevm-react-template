"use client";

import { createConfig, http, webSocket } from "wagmi";
import { sepolia } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { getBestWebSocketUrl, RPC_CONFIG } from "./config";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet, metaMaskWallet, walletConnectWallet],
    },
  ],
  {
    appName: "Sealr",
    projectId,
  }
);

export const config = createConfig({
  connectors,
  chains: [sepolia],
  transports: {
    [sepolia.id]: webSocket(getBestWebSocketUrl()),
  },
  ssr: true,
});
