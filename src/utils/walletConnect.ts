import { CoreTypes } from "@walletconnect/types";
import { Web3Modal } from "@web3modal/standalone";
import { extension as reefExt, logoSvgUrl } from '@reef-chain/util-lib';

const web3Modal = new Web3Modal({
  projectId: reefExt.WC_PROJECT_ID,
  walletConnectVersion: 2,
  enableExplorer: false,
  explorerRecommendedWalletIds: "NONE",
  themeMode: "light",
  themeVariables: {
    "--w3m-accent-color": "#a93185",
    "--w3m-accent-fill-color": "#5d3bad",
    "--w3m-background-color": "#a93185",
    "--w3m-z-index": "1001",
    "--w3m-logo-image-url": logoSvgUrl.logoSvgUrl,
  },
});

const appMetadata: CoreTypes.Metadata = { 
  name: 'Sample dApp',
  description: 'A sample dApp to demonstrate WalletConnect integration',
  url: window.location.origin,
  icons: [window.location.origin + '/favicon.ico'],
};

export const connectWc = async (): Promise<reefExt.WcConnection | undefined> => {
  try {
    const client = await reefExt.initWcClient(appMetadata);

    const { uri, approval } = await client.connect({
      requiredNamespaces: reefExt.getWcRequiredNamespaces(),
    });

    if (uri) {
      web3Modal.openModal({ uri });
    } else {
      throw new Error("No uri found");
    }

    const session = await approval();
    web3Modal.closeModal();
    return { client, session };
  } catch (error) {
    console.error("Error connecting WalletConnect:", error);
    web3Modal.closeModal();
    return undefined;
  }
};
