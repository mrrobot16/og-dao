import hre from "hardhat";

import utils from "../../utils";
import { TokenV0ABI, TokenProxyABI, TokenV1ABI } from "../../../abis";

const { ethers } = hre;
const { writeFileSync } = utils;

// Logic Contacts
// Proxy Admin Contract
// TransparentUpgradeableProxy Contract

const million = 1000*1000*1000*1000;

async function ProxyV0() {
  const { HARDHAT_NETWORK } = (process as any).env
  const network: string = HARDHAT_NETWORK as string;
  try {
    
    let fileObject1: any = {}
    const TokenV0 = await ethers.getContractFactory("TokenV0");
    const tokenV0 = await TokenV0.deploy();
    const { address: tokenV0Address } = tokenV0;
    
    fileObject1["name"] = "TokenV0"
    fileObject1[network] = tokenV0Address;
    fileObject1 = JSON.stringify(fileObject1);
    writeFileSync(`./scripts/addresses/${HARDHAT_NETWORK}-TokenV0-address.json`, fileObject1);
    
    const TokenProxyAdmin = await ethers.getContractFactory("TokenProxyAdmin");
    const ProxyAdmin = await TokenProxyAdmin.deploy();    
    const { address: tokenProxyAdminAddress } = ProxyAdmin;
    
    let fileObject2: any = {}
    fileObject2["name"] = "TokenProxyAdmin";
    fileObject2[network] = tokenProxyAdminAddress;
    fileObject2 = JSON.stringify(fileObject2);
    writeFileSync(`./scripts/addresses/${HARDHAT_NETWORK}-TokenProxyAdmin-address.json`, fileObject2);
    
    const abiInterface = new ethers.utils.Interface(TokenV0ABI);
    const functionToCall = "initialize";
    const totalSupply = million;
    const parameters = ["OG Coin", "OGC", 6, totalSupply];
    const bytes = abiInterface.encodeFunctionData(functionToCall, parameters);
    
    const TokenProxy = await ethers.getContractFactory("TokenProxy");
    const tokenProxy = await TokenProxy.deploy(tokenV0Address, tokenProxyAdminAddress, bytes, { gasLimit: 1000000 });
    const { address } = tokenProxy;
    
    let fileObject3: any = {}
    fileObject3["name"] = "TokenProxy";
    fileObject3[network] =  address;
    fileObject3 = JSON.stringify(fileObject3);
    writeFileSync(`./scripts/addresses/${HARDHAT_NETWORK}-TokenProxy-address.json`, fileObject3);
    
  } catch (error) {
    console.log("error in before", error);
  }
}

ProxyV0()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
  
  
  