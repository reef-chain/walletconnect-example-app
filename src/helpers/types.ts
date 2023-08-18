import { Provider } from '@reef-defi/evm-provider';

export interface ChainsMap {
  [reference: string]: ChainData;
}

export interface ChainData {
  name: string;
  id: string;
  genesisHash: string;
  rpc: string[];
  testnet: boolean;
  logo: string;
  rgb: string;
  flipperContractAddress: string;
  provider?: Provider;
}

export interface MethodArgument {
  type: string;
}

export interface Method {
  signature: string;
  name: string;
  args: MethodArgument[];
}

export interface AccountAction {
  method: string;
  callback: (reference: string, address: string) => Promise<void>;
}