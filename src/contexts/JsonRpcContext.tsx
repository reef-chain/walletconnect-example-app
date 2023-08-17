import { createContext, ReactNode, useContext, useState } from "react";
import { useWalletConnectClient } from "./ClientContext";
import {
  CHAINS,
  DEFAULT_REEF_METHODS,
} from "../helpers/config";
import { WsProvider } from '@polkadot/api'
import { signatureVerify, cryptoWaitReady } from "@polkadot/util-crypto";
import { SignerPayload } from '@polkadot/types/interfaces';
import { objectSpread } from '@polkadot/util';
import { Provider, Signer } from '@reef-defi/evm-provider';
import { handleTxResponse, toBN } from "@reef-defi/evm-provider/utils";
import { FlipperAbi } from '../abi/Flipper';
import { ethers } from "ethers";
import { createSubmittable } from "@polkadot/api/submittable";
import { SigningKey } from "ethers/lib/utils";

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


export const checkFlipperValue = async (reference: string) => {
  const provider = new Provider({
    provider: new WsProvider(CHAINS[reference].rpc[0]),
  });
  
  const contract = new ethers.Contract(
    CHAINS[reference].flipperContractAddress,
    FlipperAbi, 
    provider as any
  );
  
  try {
    await provider.api.isReadyOrError;
    const result = await contract.get();
    console.log('result:', result);
  } catch (e) {
    console.log('ERROR:', e);
    throw e;
  }
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

  const buildPayload = async (reference: string, signerAddress: string) => {
    const provider = new Provider({
      provider: new WsProvider(CHAINS[reference].rpc[0]),
    });
    const api = provider.api;

    const contract = new ethers.Contract(
      CHAINS[reference].flipperContractAddress,
      FlipperAbi, 
      provider as any
    );

    const tx = await contract.populateTransaction.flip();

    try {
      await api.isReadyOrError;

      const lastHeader = await api.rpc.chain.getHeader();
      const blockNumber = api.registry.createType('BlockNumber', lastHeader.number.toNumber());

      const signerEvmAddress= await api.query.evmAccounts.evmAddresses(signerAddress);
      if (signerEvmAddress.isEmpty) throw new Error(`No EVM address found for signer ${signerAddress}`);
      tx.from = signerEvmAddress.toString();
      const resources = await provider.estimateResources(tx);
      const gasLimit = resources.gas.mul(31).div(10); // Multiply by 3.1
      const storageLimit = resources.storage.mul(31).div(10); // Multiply by 3.1

      const extrinsic = api.tx.evm.call(
        tx.to,
        tx.data,
        toBN(tx.value),
        toBN(gasLimit),
        toBN(storageLimit.isNegative() ? 0 : storageLimit)
      );
      const method = api.createType('Call', extrinsic);

      const era = api.registry.createType('ExtrinsicEra', {
        current: lastHeader.number.toNumber(),
        period: 64
      });
      const nonce = await api.rpc.system.accountNextIndex(signerAddress);
      const tip = api.registry.createType('Compact<Balance>', 0).toHex();

      const payload = {
        specVersion: api.runtimeVersion.specVersion.toString(),
        transactionVersion: api.runtimeVersion.transactionVersion.toHex(),
        address: signerAddress,
        blockHash: lastHeader.hash.toHex(),
        blockNumber: blockNumber.toHex(),
        era: era.toHex(),
        genesisHash: api.genesisHash.toHex(),
        method: method.toHex(),
        nonce: nonce.toHex(),
        signedExtensions: [
          'CheckSpecVersion',
          'CheckTxVersion',
          'CheckGenesis',
          'CheckMortality',
          'CheckNonce',
          'CheckWeight',
          'ChargeTransactionPayment',
          'SetEvmOrigin'
        ],
        tip: tip,
        version: extrinsic.version
      };

      console.log('payload=', payload);
      return { payload, extrinsic, provider };
    } catch (e) {
      console.log('ERROR:', e);
      throw e;
    }
  };

  const reefRpc = {
    testSignTransaction: _createJsonRpcRequestHandler(
      async (
        reference: string,
        address: string
      ): Promise<IFormattedRpcResponse> => {
        const { payload, extrinsic, provider } = await buildPayload(reference, address);

        const signResult = await client!.request<{
          payload: string;
          signature: string;
        }>({
          chainId: CHAINS[reference].id,
          topic: session!.topic,
          request: {
            method: DEFAULT_REEF_METHODS.REEF_SIGN_TRANSACTION,
            params: {
              address,
              transactionPayload: payload,
              abi: FlipperAbi
            },
          },
        });

        extrinsic.addSignature(address, signResult.signature, payload);

        const txResult = await new Promise((resolve, reject) => {
          extrinsic.send((result) => {
            handleTxResponse(result, provider.api)
              .then(() => {
                resolve(result);
              })
              .catch(({ message }) => {
                reject(message);
              });
          }).catch((error) => {
            reject(error && error.message);
          });
        });

        console.log('txResult:', txResult);

        return {
          method: DEFAULT_REEF_METHODS.REEF_SIGN_TRANSACTION,
          address,
          valid: true,
          result: signResult.signature,
        };
      }
    ),
    testSignMessage: _createJsonRpcRequestHandler(
      async (
        reference: string,
        address: string
      ): Promise<IFormattedRpcResponse> => {
        const message = `This is an example message to be signed - ${Date.now()}`;

        const signResult = await client!.request<{ signature: string }>({
          chainId: CHAINS[reference].id,
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
          signResult.signature,
          address
        );

        return {
          method: DEFAULT_REEF_METHODS.REEF_SIGN_MESSAGE,
          address,
          valid,
          result: signResult.signature,
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
