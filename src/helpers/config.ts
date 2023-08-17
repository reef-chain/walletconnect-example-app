import { ChainsMap } from "./types";

if (!process.env.NEXT_PUBLIC_PROJECT_ID)
  throw new Error("`NEXT_PUBLIC_PROJECT_ID` env variable is missing.");

export const CHAINS: ChainsMap = {
  ["7834781d38e4798d548e34ec947d19de"]: {
    id: "reef:7834781d38e4798d548e34ec947d19de",
    genesisHash: "0x7834781d38e4798d548e34ec947d19deea29df148a7bf32484b7b24dacf8d4b7",
    name: "Reef Mainnet",
    rpc: ["wss://rpc.reefscan.info/ws"],
    testnet: false,
    logo: "/assets/reef.jpg",
    rgb: "169, 49, 133",
    flipperContractAddress: "",
  },
  ["b414a8602b2251fa538d38a932239150"]: {
    id: "reef:b414a8602b2251fa538d38a932239150",
    name: "Reef Testnet (Scuba)",
    genesisHash: "0xb414a8602b2251fa538d38a9322391500bd0324bc7ac6048845d57c37dd83fe6",
    rpc: ["wss://rpc-testnet.reefscan.info/ws"],
    testnet: true,
    logo: "/assets/reef.jpg",
    rgb: "93, 59, 173",
    flipperContractAddress: "0xb7bFaE6567dEDf3DC6Dd498A527B2c4d88d3B9b9" // "0x6252dc9516792de316694d863271bd25c07e621b"
  },
};

export const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;
export const DEFAULT_RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;

export const DEFAULT_LOGGER = "debug";

export const DEFAULT_APP_METADATA = {
  name: "React App",
  description: "React App for WalletConnect",
  url: "https://walletconnect.com/",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export enum DEFAULT_REEF_METHODS {
  REEF_SIGN_TRANSACTION = "reef_signTransaction",
  REEF_SIGN_MESSAGE = "reef_signMessage",
}

export enum DEFAULT_REEF_EVENTS {}

type RelayerType = {
  value: string | undefined;
  label: string;
};

export const REGIONALIZED_RELAYER_ENDPOINTS: RelayerType[] = [
  {
    value: DEFAULT_RELAY_URL,
    label: "Default",
  },
  {
    value: "wss://us-east-1.relay.walletconnect.com",
    label: "US",
  },
  {
    value: "wss://eu-central-1.relay.walletconnect.com",
    label: "EU",
  },
  {
    value: "wss://ap-southeast-1.relay.walletconnect.com",
    label: "Asia Pacific",
  },
];
