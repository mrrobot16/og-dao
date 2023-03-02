import hre from "hardhat";
import BN from "bn.js";
import open from "open";

import utils from "../../utils";

const { writeFileSync } = utils;
import { TokenV0, TokenV0ABI } from "../../../abis";

async function V0() {
  let fileObject: any = {}
  const { HARDHAT_NETWORK } = process.env;
  const network: string = HARDHAT_NETWORK as string;

  const AllowanceSheet = await hre.ethers.getContractFactory("Token_AllowanceSheet");
  const allowanceSheet = await AllowanceSheet.deploy();
  
  const BalanceSheet = await hre.ethers.getContractFactory("Token_BalanceSheet");
  const balanceSheet = await BalanceSheet.deploy();

  await allowanceSheet.deployed();
  
  await balanceSheet.deployed();

  console.log(`TokenProxy deployed to ${HARDHAT_NETWORK} network`)
  console.log("AllowanceSheet deployed to:", allowanceSheet.address);
  console.log("BalanceSheet deployed to:", balanceSheet.address);
  fileObject[network] = allowanceSheet.address;

  writeFileSync(`./scripts/mint/${HARDHAT_NETWORK}token-allowances-address.json`, JSON.stringify(fileObject));
  
  fileObject[network] = balanceSheet.address;

  writeFileSync(`./scripts/mint/${HARDHAT_NETWORK}token-balances-address.json`, JSON.stringify(fileObject));
  const config = {
    name: "Token DAO",
    symbol: "OGC",
    allowances: allowanceSheet.address,
    balances: balanceSheet.address
  }
  
  const { name, symbol, balances, allowances } = config;
  const decimals = 6
  const Token = await hre.ethers.getContractFactory("TokenV0");
  const token = await Token.deploy(name, symbol, balances, allowances, decimals);
  
  await token.deployed();
  
  let { address } = token;
  console.log("TokenV0 deployed to", token.address);
  
  fileObject[network] = address;
  writeFileSync(`./scripts/mint/${HARDHAT_NETWORK}token-address.json`, JSON.stringify(fileObject));
  writeFileSync(`../ui/src/services/web3/${HARDHAT_NETWORK}token-address.json`, JSON.stringify(fileObject));
  
  const TokenProxy = await hre.ethers.getContractFactory("TokenProxy");
  const proxy = await TokenProxy.deploy(address, balances, allowances);
  await proxy.deployed()
  
  const  { address: proxyAddress } = proxy;
  console.log("TokenProxy deployed to", proxyAddress);

  // const implementationAddress = await proxy.implementation();
  
  // const allowancesOwnership = await allowanceSheet.transferOwnership(implementationAddress);
  const allowancesOwnership = await allowanceSheet.transferOwnership(proxyAddress);
  console.log('allowancesOwnership', allowancesOwnership);
  
  // const balancesOwnership = await balanceSheet.transferOwnership(implementationAddress);
  const balancesOwnership = await balanceSheet.transferOwnership(proxyAddress);
  console.log('balancesOwnership', balancesOwnership);
  
  const tokenOwnership = await token.transferOwnership(proxyAddress);
  console.log('tokenOwnership', tokenOwnership);

  fileObject = {}
  fileObject[network] = proxyAddress;
  writeFileSync(`../ui/src/services/web3/${HARDHAT_NETWORK}proxy-token-address.json`, JSON.stringify(fileObject));
  writeFileSync(`./scripts/mint/${HARDHAT_NETWORK}proxy-token-address.json`, JSON.stringify(fileObject));
}

V0()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });