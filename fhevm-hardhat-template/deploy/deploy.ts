import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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
    try {
      console.log("Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: deployedConfidentialMessenger.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully on Etherscan");
    } catch (error) {
      console.log("❌ Contract verification failed:", error);
    }
  } else {
    console.log("⏭️  Skipping verification for local network");
  }
};
export default func;
func.id = "deploy_confidentialMessenger";
func.tags = ["ConfidentialMessenger"];
