import { LandingPage } from "@/components/landing-page"
import { ContractDemo } from "@/components/contract-demo"
import { FhevmDemo } from "@/components/fhevm-demo"

export default function Home() {
  return (
    <div>
      <LandingPage />
      <div className="mt-8 space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">FHEVM Integration</h2>
          <p className="text-gray-600">
            Confidential messaging with fully homomorphic encryption on Sepolia testnet
          </p>
        </div>
        <FhevmDemo />
        <ContractDemo />
      </div>
    </div>
  )
}
