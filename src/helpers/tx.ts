import * as encoding from "@walletconnect/encoding";

import { apiGetAccountNonce, apiGetGasPrice } from "./api";
import { CHAINS } from "./config";

export async function formatTestTransaction(account: string) {
  const [_namespace, reference, address] = account.split(":");

  let _nonce;
  try {
    _nonce = await apiGetAccountNonce(address, reference);
  } catch (error) {
    throw new Error(
      `Failed to fetch nonce for address ${address} on chain ${CHAINS[reference].name}`
    );
  }

  const nonce = encoding.sanitizeHex(encoding.numberToHex(_nonce));

  // gasPrice
  const _gasPrice = await apiGetGasPrice(reference);
  const gasPrice = encoding.sanitizeHex(_gasPrice);

  // gasLimit
  const _gasLimit = 21000;
  const gasLimit = encoding.sanitizeHex(encoding.numberToHex(_gasLimit));

  // value
  const _value = 0;
  const value = encoding.sanitizeHex(encoding.numberToHex(_value));

  const tx = {
    from: address,
    to: address,
    data: "0x",
    nonce,
    gasPrice,
    gasLimit,
    value,
  };

  return tx;
}
