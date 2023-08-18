import { BigNumberish, utils } from "ethers";
import { ProposalTypes } from "@walletconnect/types";
import { WsProvider } from '@polkadot/api'
import { Provider } from '@reef-defi/evm-provider';
import { CHAINS, DEFAULT_REEF_EVENTS, DEFAULT_REEF_METHODS } from "./config";

export function ellipseAddress(address = "", width = 10): string {
  return `${address.slice(0, width)}...${address.slice(-width)}`;
}

export const sanitizeDecimals = (value: string, decimals = 18): string => {
  const [integer, fractional] = value.split(".");
  const _fractional = fractional
    ? fractional.substring(0, decimals).replace(/0+$/gi, "")
    : undefined;
  return _fractional ? [integer, _fractional].join(".") : integer;
};

export const fromWad = (wad: BigNumberish, decimals = 18): string => {
  return sanitizeDecimals(utils.formatUnits(wad, decimals), decimals);
};

export const getRequiredNamespaces = (
): ProposalTypes.RequiredNamespaces => {
  return {
    reef: {
      methods: Object.values(DEFAULT_REEF_METHODS),
      chains: Object.values(CHAINS).map((chain) => chain.id),
      events: Object.values(DEFAULT_REEF_EVENTS) as any[],
    }
  }
};

export const initProviders = async () => {
  Object.keys(CHAINS).map(async (reference) => {
    const provider = new Provider({
      provider: new WsProvider(CHAINS[reference].rpc[0]),
    });
    
    try {
      await provider.api.isReadyOrError;
      CHAINS[reference].provider = provider;
    } catch (e) {
      console.log('Provider API error:', e);
      throw e;
    }
  });
}