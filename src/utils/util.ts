import { Provider, Signer } from "@reef-chain/evm-provider";
import { blake2AsU8a, decodeAddress } from "@polkadot/util-crypto";
import { u8aConcat, u8aEq, u8aToHex } from "@polkadot/util";
import { extension as reefExt } from '@reef-chain/util-lib';
import { formatEther, getAddress } from "ethers";

export interface ReefAccount {
  name: string;
  balance: BigInt;
  address: string;
  evmAddress: string;
  isEvmClaimed: boolean;
  signer?: Signer;
}

export async function getReefExtension(
  appName: string
): Promise<reefExt.InjectedExtension | undefined> {
  const extensionsArr = await reefExt.web3Enable(appName);

  const wcWallet = extensionsArr.find(
    (e: any) => e.name === reefExt.REEF_WALLET_CONNECT_IDENT
  );

  return wcWallet;
}

const computeDefaultEvmAddress = (address: string): string => {
  const publicKey = decodeAddress(address);

  const isStartWithEvm = u8aEq("evm:", publicKey.slice(0, 4));

  if (isStartWithEvm) {
    return getAddress(u8aToHex(publicKey.slice(4, 24)));
  }

  return getAddress(
    u8aToHex(blake2AsU8a(u8aConcat("evm:", publicKey), 256).slice(0, 20))
  );
};

export const queryEvmAddress = async (
  address: string,
  provider: Provider
): Promise<{ evmAddress: string; isEvmClaimed: boolean }> => {
  const claimedAddress = await provider.api.query.evmAccounts.evmAddresses(
    address
  );
  if (claimedAddress) {
    const evmAddress = getAddress(claimedAddress.toString());
    return { evmAddress, isEvmClaimed: true };
  }

  return { evmAddress: computeDefaultEvmAddress(address), isEvmClaimed: false };
};

export const toAddressShortDisplay = (address: string, size = 19): string => {
  return address.length < size
    ? address
    : `${address.slice(0, size - 5)}...${address.slice(address.length - 5)}`;
};

export const accountToReefAccount = async (
  account: reefExt.InjectedAccount,
  provider: Provider
): Promise<ReefAccount> => {
  const { evmAddress, isEvmClaimed } = await queryEvmAddress(
    account.address,
    provider
  );

  return {
    name: account.name || "",
    balance: 0n,
    address: account.address,
    evmAddress,
    isEvmClaimed,
  };
};

export const subscribeToBalance = async (
  signer: Signer,
  cb: (freeBalance: any) => void
): Promise<any> => {
  let address = await signer.getSubstrateAddress();
  const unsub = await signer.provider.api.query.system.account(
    address,
    ({ data: balance }) => {
      cb(BigInt(balance.free.toString()));
    }
  );
  return unsub;
};

export const toReefAmount = (amount: BigInt, decimals = 2): string => {
  const reefUnits = formatEther(amount.toString());
  return parseFloat(reefUnits).toFixed(decimals);
};
