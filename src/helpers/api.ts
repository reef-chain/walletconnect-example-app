import axios, { AxiosInstance } from "axios";
import { AssetData } from "./types";

const api: AxiosInstance = axios.create({
  baseURL: "https://ethereum-api.xyz",
  timeout: 10000, // 10 secs
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export async function apiGetAccountBalance(
  address: string,
  reference: string
): Promise<AssetData> {
  // TODO get balance
  return { balance: "", symbol: "", name: "" };

  // const namespace = chainId.split(":")[0];
  // if (namespace !== "eip155") {
  //   return { balance: "", symbol: "", name: "" };
  // }
  // const ethChainId = chainId.split(":")[1];
  // const rpc = rpcProvidersByChainId[Number(ethChainId)];
  // if (!rpc) {
  //   return { balance: "", symbol: "", name: "" };
  // }
  // const { baseURL, token } = rpc;
  // const response = await api.post(baseURL, {
  //   jsonrpc: "2.0",
  //   method: "eth_getBalance",
  //   params: [address, "latest"],
  //   id: 1,
  // });
  // const { result } = response.data;
  // const balance = parseInt(result, 16).toString();
  // return { balance, ...token };
}

export const apiGetAccountNonce = async (
  address: string,
  reference: string
): Promise<number> => {
  // TODO get nonce
  return 0;
  // const ethChainId = chainId.split(":")[1];
  // const { baseURL } = rpcProvidersByChainId[Number(ethChainId)];
  // const response = await api.post(baseURL, {
  //   jsonrpc: "2.0",
  //   method: "eth_getTransactionCount",
  //   params: [address, "latest"],
  //   id: 1,
  // });
  // const { result } = response.data;
  // const nonce = parseInt(result, 16);
  // return nonce;
};

export const apiGetGasPrice = async (reference: string): Promise<string> => {
  // TODO get gas price ?
  return "0";

  // const ethChainId = chainId.split(":")[1];
  // const { baseURL } = rpcProvidersByChainId[Number(ethChainId)];
  // const response = await api.post(baseURL, {
  //   jsonrpc: "2.0",
  //   method: "eth_gasPrice",
  //   params: [],
  //   id: 1,
  // });
  // const { result } = response.data;
  // return result;
};
