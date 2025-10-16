import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { vars } from "hardhat/config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedConfidentialMessenger = await deploy("ConfidentialMessenger", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });

  console.log(`ConfidentialMessenger contract: `, deployedConfidentialMessenger.address);

  // Verify the contract on Etherscan (skip for local networks)
  if (hre.network.name !== "hardhat" && hre.network.name !== "anvil" && hre.network.name !== "localhost") {
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY || vars.get("ETHERSCAN_API_KEY", "");
    
    if (!etherscanApiKey) {
      console.log("⚠️  ETHERSCAN_API_KEY not found. Skipping verification.");
      console.log("   To enable verification, set ETHERSCAN_API_KEY in your environment variables.");
    } else {
      try {
        console.log("Verifying contract on Etherscan...");
        await hre.run("verify:verify", {
          address: deployedConfidentialMessenger.address,
          constructorArguments: [],
        });
        console.log("✅ Contract verified successfully on Etherscan");
      } catch (error) {
        console.log("❌ Contract verification failed:", error);
        console.log("   You can manually verify the contract later using:");
        console.log(`   npx hardhat verify --network ${hre.network.name} ${deployedConfidentialMessenger.address}`);
      }
    }
  } else {
    console.log("⏭️  Skipping verification for local network");
  }
};
export default func;
func.id = "deploy_confidentialMessenger";
func.tags = ["ConfidentialMessenger"];
