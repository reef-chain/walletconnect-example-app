import { createContext, ReactNode, useContext, useState } from "react";
import { useWalletConnectClient } from "./ClientContext";
import {
  CHAINS,
  DEFAULT_REEF_METHODS,
} from "../helpers/config";
import { ApiPromise, WsProvider } from '@polkadot/api'
import { signatureVerify, cryptoWaitReady } from "@polkadot/util-crypto";
import { Provider } from '@reef-defi/evm-provider';
import { FlipperAbi } from '../abi/Flipper';

/**
 * Types
 */
interface IFormattedRpcResponse {
  method?: string;
  address?: string;
  valid: boolean;
  result: string;
}

type TRpcRequestCallback = (chainId: string, address: string) => Promise<void>;

interface IContext {
  reefRpc: {
    testSignMessage: TRpcRequestCallback;
    testSignTransaction: TRpcRequestCallback;
  };
  rpcResult?: IFormattedRpcResponse | null;
  isRpcRequestPending: boolean;
}

/**
 * Context
 */
export const JsonRpcContext = createContext<IContext>({} as IContext);

/**
 * Provider
 */
export function JsonRpcContextProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<IFormattedRpcResponse | null>();

  const { client, session } =
    useWalletConnectClient();

  const _createJsonRpcRequestHandler =
    (
      rpcRequest: (
        chainId: string,
        address: string
      ) => Promise<IFormattedRpcResponse>
    ) =>
    async (chainId: string, address: string) => {
      if (typeof client === "undefined") {
        throw new Error("WalletConnect is not initialized");
      }
      if (typeof session === "undefined") {
        throw new Error("Session is not connected");
      }

      try {
        setPending(true);
        const result = await rpcRequest(chainId, address);
        setResult(result);
      } catch (err: any) {
        console.error("RPC request failed: ", err);
        setResult({
          address,
          valid: false,
          result: err?.message ?? err,
        });
      } finally {
        setPending(false);
      }
    };

  const buildPayload = async (genesisHash: string, address: string) => {
    // const provider = new Provider({
    //   provider: new WsProvider(CHAINS[chainId].rpc[0]),
    // });
    // const api = provider.api;
    // try {
    //   await api.isReadyOrError;
    // } catch (e) {
    //   console.log('Provider isReadyOrError ERROR=', e);
    //   throw e;
    // }

    const payload = {
      specVersion: "0x00000005",
      transactionVersion: "0x00000001",
      address: address,
      blockHash: "0x39e696f20c34f21408d36302a35cf4d3b1926237ed946e92c099101c5349be69",
      blockNumber: "0x0012ec7e",
      era: "0xe503",
      genesisHash: genesisHash,
      method: "0x1500b7bfae6567dedf3dc6dd498a527b2c4d88d3b9b910cde4efa900000000000000000000000000000000203602000000000000000000",
      nonce: "0x0000005f",
      signedExtensions: ['CheckSpecVersion', 'CheckTxVersion', 'CheckGenesis', 'CheckMortality', 'CheckNonce', 'CheckWeight', 'ChargeTransactionPayment', 'SetEvmOrigin'],
      tip: "0x00000000000000000000000000000000",
      version: 4,
    };

    return payload;
  };

  const reefRpc = {
    testSignTransaction: _createJsonRpcRequestHandler(
      async (
        genesisHash: string,
        address: string
      ): Promise<IFormattedRpcResponse> => {
        const transactionPayload = await buildPayload(genesisHash, address);

        const result = await client!.request<{
          payload: string;
          signature: string;
        }>({
          chainId: CHAINS[genesisHash].id,
          topic: session!.topic,
          request: {
            method: DEFAULT_REEF_METHODS.REEF_SIGN_TRANSACTION,
            params: {
              address,
              transactionPayload,
              abi: FlipperAbi
            },
          },
        });

        return {
          method: DEFAULT_REEF_METHODS.REEF_SIGN_TRANSACTION,
          address,
          valid: true,
          result: result.signature,
        };
      }
    ),
    testSignMessage: _createJsonRpcRequestHandler(
      async (
        genesisHash: string,
        address: string
      ): Promise<IFormattedRpcResponse> => {
        const message = `This is an example message to be signed - ${Date.now()}`;

        const result = await client!.request<{ signature: string }>({
          chainId: CHAINS[genesisHash].id,
          topic: session!.topic,
          request: {
            method: DEFAULT_REEF_METHODS.REEF_SIGN_MESSAGE,
            params: {
              address,
              message,
            },
          },
        });

        // sr25519 signatures need to wait for WASM to load
        await cryptoWaitReady();
        const { isValid: valid } = signatureVerify(
          message,
          result.signature,
          address
        );

        return {
          method: DEFAULT_REEF_METHODS.REEF_SIGN_MESSAGE,
          address,
          valid,
          result: result.signature,
        };
      }
    ),
  };

  return (
    <JsonRpcContext.Provider
      value={{
        reefRpc,
        rpcResult: result,
        isRpcRequestPending: pending,
      }}
    >
      {children}
    </JsonRpcContext.Provider>
  );
}

export function useJsonRpc() {
  const context = useContext(JsonRpcContext);
  if (context === undefined) {
    throw new Error("useJsonRpc must be used within a JsonRpcContextProvider");
  }
  return context;
}
