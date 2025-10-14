import { LandingPage } from "@/components/landing-page"
import { ContractDemo } from "@/components/contract-demo"
import { FhevmDemo } from "@/components/fhevm-demo"

export default function Home() {
  return (
    <div>
      <LandingPage />
      <div className="mt-8 space-y-8">
        <FhevmDemo />
        <ContractDemo />
      </div>
    </div>
  )
}
