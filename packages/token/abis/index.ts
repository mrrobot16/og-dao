import TokenV0 from "../artifacts/contracts/token/TokenV0.sol/TokenV0.json";
import TokenV1 from "../artifacts/contracts/token/TokenV1.sol/TokenV1.json";
import TokenProxy from "../artifacts/contracts/proxy/TokenProxy.sol/TokenProxy.json";


export const TokenV0ABI = TokenV0.abi;
export const TokenV1ABI = TokenV1.abi;
export const TokenProxyABI = TokenProxy.abi;

export {
  TokenV0,
  TokenV1,
  TokenProxy,
}