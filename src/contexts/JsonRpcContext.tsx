import { createContext, ReactNode, useContext, useState } from "react";
import { useWalletConnectClient } from "./ClientContext";
import {
  CHAINS,
  DEFAULT_REEF_METHODS,
} from "../helpers";
import { signatureVerify, cryptoWaitReady } from "@polkadot/util-crypto";
import { Provider } from '@reef-defi/evm-provider';
import { dataToString, handleTxResponse, toBN } from "@reef-defi/evm-provider/utils";
import { FlipperAbi } from '../abi/Flipper';
import { ethers } from "ethers";
import type {
  TransactionReceipt
} from '@ethersproject/abstract-provider';

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
  const provider = CHAINS[reference].provider;
  if (!provider) throw new Error(`No provider found for chain ${reference}`);

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

export const JsonRpcContext = createContext<IContext>({} as IContext);

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

  const buildPayload = async (provider: Provider, reference: string, signerAddress: string) => {
    const contract = new ethers.Contract(
      CHAINS[reference].flipperContractAddress,
      FlipperAbi, 
      provider as any
    );

    const tx = await contract.populateTransaction.flip();

    try {
      const lastHeader = await provider.api.rpc.chain.getHeader();
      const blockNumber = provider.api.registry.createType('BlockNumber', lastHeader.number.toNumber());

      const signerEvmAddress= await provider.api.query.evmAccounts.evmAddresses(signerAddress);
      if (signerEvmAddress.isEmpty) throw new Error(`No EVM address found for signer ${signerAddress}`);
      tx.from = signerEvmAddress.toString();
      const resources = await provider.estimateResources(tx);
      const gasLimit = resources.gas.mul(31).div(10); // Multiply by 3.1
      const storageLimit = resources.storage.mul(31).div(10); // Multiply by 3.1

      const extrinsic = provider.api.tx.evm.call(
        tx.to,
        tx.data,
        toBN(tx.value),
        toBN(gasLimit),
        toBN(storageLimit.isNegative() ? 0 : storageLimit)
      );
      const method = provider.api.createType('Call', extrinsic);

      const era = provider.api.registry.createType('ExtrinsicEra', {
        current: lastHeader.number.toNumber(),
        period: 64
      });
      const nonce = await provider.api.rpc.system.accountNextIndex(signerAddress);
      const tip = provider.api.registry.createType('Compact<Balance>', 0).toHex();

      const payload = {
        specVersion: provider.api.runtimeVersion.specVersion.toString(),
        transactionVersion: provider.api.runtimeVersion.transactionVersion.toHex(),
        address: signerAddress,
        blockHash: lastHeader.hash.toHex(),
        blockNumber: blockNumber.toHex(),
        era: era.toHex(),
        genesisHash: provider.api.genesisHash.toHex(),
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
      return { payload, extrinsic, tx };
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
        const provider = CHAINS[reference].provider;
        if (!provider) throw new Error(`No provider found for chain ${reference}`);

        const { payload, extrinsic, tx } = await buildPayload(provider, reference, address);

        let valid = false;
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
                valid = true;
                resolve({
                  hash: extrinsic.hash.toHex(),
                  from: tx.from || '',
                  confirmations: 0,
                  nonce: (tx.nonce || 0).toString(),
                  gasLimit: (tx.gasLimit || 0).toString(),
                  gasPrice: '0',
                  data: dataToString(tx.data!),
                  value: (tx.value || 0).toString(),
                  chainId: 13939,
                  wait: (confirmations?: number): Promise<TransactionReceipt> => {
                    return provider._resolveTransactionReceipt(
                      extrinsic.hash.toHex(),
                      result.status.asInBlock.toHex(),
                      tx.from || '',
                    );
                  }
                });
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
          valid,
          result: JSON.stringify(txResult),
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
