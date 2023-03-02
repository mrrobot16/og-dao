import hre from "hardhat";
import { expect } from "chai";

import { TokenV0ABI, TokenProxyABI, TokenV1ABI } from "../../abis";

const { ethers } = hre;

// Deploy in this order:
// TokenV0Logic
// TokenProxyAdmin Contract
// TokenTransparentUpgradeableProxy Contract

const million = 1000*1000;
const mockTransferAmount = 1000*10;

describe("Token Admin Proxy contract", function() {

  before("Deploy prequisite contracts first", async function() {
      const TokenV0 = await ethers.getContractFactory("TokenV0");
      const tokenV0 = await TokenV0.deploy();
      const { address: tokenV0Address, } = tokenV0;
      
      const TokenProxyAdmin = await ethers.getContractFactory("TokenProxyAdmin");
      const tokenProxyAdmin = await TokenProxyAdmin.deploy();
      this.ProxyAdmin = tokenProxyAdmin;
      
      const { address: tokenProxyAdminAddress } = tokenProxyAdmin;
      
      this.addresses = {
        TokenV0: tokenV0Address,
        TokenProxyAdmin: tokenProxyAdminAddress,
      }
      
      this.abi = {
        TokenV0ABI,
        TokenV1ABI,
        TokenProxyABI,
      }

      const abiInterface = new ethers.utils.Interface(this.abi.TokenV0ABI);
      const functionToCall = "initialize";
      this.totalSupply = million;
      const parameters = ["Token DAO", "OGC", 6, this.totalSupply];
      this.bytes = abiInterface.encodeFunctionData(functionToCall, parameters);

      this.spender = "0x5Db06acd673531218B10430bA6dE9b69913Ad545";

  });

  it("Should deploy TokenProxy", async function() {
    const TokenProxy = await ethers.getContractFactory("TokenProxy");
    this.TokenProxy = await TokenProxy.deploy(this.addresses.TokenV0, this.addresses.TokenProxyAdmin, this.bytes);
    const { address } = this.TokenProxy;
    this.addresses = {
      ...this.addresses,
      TokenProxy: address,
    }

    expect(address).to.exist;
  });
  
  it("Should instanciate TokenV0Proxy contract", async function () {
    this.TokenV0Proxy = await ethers.getContractAt(this.abi.TokenV0ABI, this.TokenProxy.address);
    const { address } = this.TokenV0Proxy;

    expect(address).to.exist;
  });
  
  it("Should have owner", async function() {
    this.owner = await this.TokenV0Proxy.owner();

    expect(this.owner).to.exist;
  });
  
  it("Should TokenV0Proxy totalSupply be equal to: 1,000,000", async function() {
    const totalSupply = await this.TokenV0Proxy.totalSupply();

    expect(Number(totalSupply)).equals(million);
  });

  it("Should approve 10,000 tokens", async function() {
    const approved = await this.TokenV0Proxy.approve(this.owner, mockTransferAmount);

    expect(approved).to.exist;
  });
  
  it("Should allowance 10,000", async function() {
    const allowance = await this.TokenV0Proxy.allowance(this.owner, this.owner);

    expect(Number(allowance)).to.equals(mockTransferAmount);
  });
  
  it("Should transferFrom tokens", async function() {
    const balanceOfProxy = Number(await this.TokenV0Proxy.balanceOf(this.owner));
    const balanceOf = Number((await this.TokenV0Proxy.balanceOf(this.spender)));
    const expectedBalanceOfProxy = balanceOfProxy - mockTransferAmount;
    
    const transfer = await this.TokenV0Proxy.transferFrom(this.owner, this.spender, mockTransferAmount);
    
    const postTransferFromBalanceOfProxy = Number(await this.TokenV0Proxy.balanceOf(this.owner));
    const postTransferFromBalanceOfRecipient = Number((await this.TokenV0Proxy.balanceOf(this.spender)));

    expect(balanceOf).to.equals(0);
    expect(postTransferFromBalanceOfRecipient).to.equals(mockTransferAmount);
    expect(postTransferFromBalanceOfProxy).to.equals(expectedBalanceOfProxy);
  });
  
  it("Should have a Transfer event with an amount of 10,000", async function() {
    const events = await  this.TokenV0Proxy.queryFilter("Transfer");
    const lastEvent = events[events.length - 1]; 
    const lastEventTransferAmount = Number(lastEvent.args[2]);

    expect(lastEventTransferAmount).to.equals(mockTransferAmount);
  });
  
  it("Should deploy TokenV1", async function() {
    const TokenV1 = await ethers.getContractFactory("TokenV1");
    this.TokenV1 = await TokenV1.deploy();
    this.addresses = {
      ...this.addresses,
      TokenV1: this.TokenV1.address,
    }
    const { address } = this.TokenV1;

    expect(address).to.exist;
  });
  
  it("Should update to a new implementation and such implementation address be equal to TokenV1 address", async function() {
    const upgrade = await this.TokenProxyAdmin.upgrade(this.TokenProxy.address, this.addresses.TokenV1);
    const implementation = await this.TokenroxyAdmin.getProxyImplementation(this.addresses.TokenProxy);

    expect(implementation).to.equals(this.TokenV1.address);
  });
  
  it("Should instanciate TokenV1Proxy contract", async function() {
    this.TokenV1Proxy = await ethers.getContractAt(this.abi.TokenV1ABI, this.addresses.TokenProxy);
    await this.TokenV1Proxy.initializeV2();

    expect(this.TokenV1Proxy.address).to.exist;
  });
  
  it("Should have a TokenV1Proxy.totalSupply equal to: 1,000,000", async function() {
    const totalSupply = await this.TokenV1Proxy.totalSupply();

    expect(Number(totalSupply)).equals(million);
  });

});

