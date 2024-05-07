import React, { useEffect, useRef, useState } from "react";
import { Provider, Signer } from "@reef-chain/evm-provider";
import { extension as reefExt } from '@reef-chain/util-lib';

import {
  ReefAccount,
  accountToReefAccount,
  getReefExtension,
  subscribeToBalance,
} from "./utils/util";
import Account from "./Account";
import { flipIt, getFlipperValue } from "./utils/flipperContract";
import { connectWc } from "./utils/walletConnect";

interface Status {
  inProgress: boolean;
  message?: string;
}

const App = (): JSX.Element => {
  const [network, setNetwork] = useState<string>();
  const [accounts, setAccounts] = useState<ReefAccount[]>([]);
  const [selectedSigner, setSelectedSigner] = useState<Signer>();
  const [selectedAccount, setSelectedAccount] = useState<ReefAccount>();
  const [provider, setProvider] = useState<Provider>();
  const [extension, setExtension] = useState<reefExt.InjectedExtension>();
  const [status, setStatus] = useState<Status>({ inProgress: false });
  const selectedAccountRef = useRef(selectedAccount);
  let unsubBalance = () => {};
  
  // Update selectedReefSigner
  useEffect(() => {
    if (selectedSigner) {
      const account = accounts.find(
        (account: ReefAccount) =>
          account.address === selectedSigner._substrateAddress
      );
      if (account) {
        account.signer = selectedSigner;
        setSelectedAccount(account);
        selectedAccountRef.current = account;
        return;
      }
    }
    setSelectedAccount(undefined);
    selectedAccountRef.current = undefined;
  }, [selectedSigner, accounts]);

  const connect = async (): Promise<any> => {
    setStatus({ inProgress: true, message: "Loading accounts..." });
    try {
      const wcConnection: reefExt.WcConnection = await connectWc(
        
      );
      if (!wcConnection) {
        console.log("No session found");
        return;
      }

      reefExt.injectWcAsExtension(wcConnection, {
        name: reefExt.REEF_WALLET_CONNECT_IDENT,
        version: "1.0.0",
      });

      let reefExtension = await getReefExtension("Test dApp");
      if (!reefExtension) {
        // If first attempt failed, wait .5 seconds and try again
        await new Promise((resolve) => setTimeout(resolve, 500));
        reefExtension = await getReefExtension("Test dApp");
      }
      if (!reefExtension) {
        throw new Error(
          "Install Reef Chain Wallet extension for Chrome or Firefox. See docs.reef.io"
        );
      }
      setExtension(reefExtension);
      const _provider = await reefExtension.reefProvider.getNetworkProvider();
      setProvider(_provider);
      const accounts = await reefExtension.accounts.get();
      console.log("accounts =", accounts);
      const _reefAccounts = await Promise.all(
        accounts.map(async (account: reefExt.InjectedAccount) =>
          accountToReefAccount(account, _provider)
        )
      );
      setAccounts(_reefAccounts);
      setStatus({ inProgress: false });

      reefExtension.accounts.subscribe(async (accounts: reefExt.InjectedAccount[]) => {
        console.log("accounts cb =", accounts);
        const _accounts = await Promise.all(
          accounts.map(async (account: reefExt.InjectedAccount) =>
            accountToReefAccount(account, _provider)
          )
        );
        setAccounts(_accounts);
      });

      reefExtension.reefSigner.subscribeSelectedSigner(
        async (sig: reefExt.ReefSignerResponse) => {
          console.log("signer cb =", sig);
          setSelectedSigner(sig.data);
          subscribeBalance(sig.data);
        },
        reefExt.ReefVM.NATIVE
      );

      reefExtension.reefProvider.subscribeSelectedNetwork((rpcUrl: string) => {
        const _network = rpcUrl.includes("testnet") ? "testnet" : "mainnet";
        setNetwork(_network);
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Subscribe to changes in selectedReefSigner balance
  const subscribeBalance = async (
    signer: Signer | undefined
  ): Promise<void> => {
    unsubBalance();
    if (signer) {
      unsubBalance = await subscribeToBalance(
        signer,
        async (balFree: BigInt) => {
          if (
            selectedAccountRef.current?.address === signer._substrateAddress
          ) {
            setSelectedAccount({
              ...selectedAccountRef.current,
              balance: balFree,
            });
          }
        }
      );
    }
  };

  // Set value in flipper contract
  const setValue = async (): Promise<void> => {
    if (!selectedSigner) {
      alert("No signer found");
      return;
    }

    if (!network) {
      alert("No network found");
      return;
    }

    try {
      setStatus({ inProgress: true, message: "Setting value..." });
      await flipIt(selectedSigner, network);
      setStatus({ inProgress: false });
      getValue();
    } catch (err: any) {
      console.error(err);
      setStatus({ inProgress: false });
    }
  };

  // Get value from flipper contract
  const getValue = async (): Promise<void> => {
    if (!provider) {
      alert("No provider found");
      return;
    }

    if (!network) {
      alert("No network found");
      return;
    }

    try {
      setStatus({ inProgress: true, message: "Getting value..." });
      const value = await getFlipperValue(provider, network);
      alert(`Flipper value is ${value.toString().toUpperCase()}`);
      setStatus({ inProgress: false });
    } catch (err: any) {
      console.error(err);
      setStatus({ inProgress: false });
    }
  };

  return (
    <div className="App">
      <h1>Reef Chain dApp</h1>
      {status.inProgress && <p>{status.message}</p>}
      {network && <p>Network: {network}</p>}
      {selectedAccount && (
        <Account account={selectedAccount} onClick={() => {}}></Account>
      )}
      {extension ? (<>
        <button onClick={getValue}>Get value</button>
        <button onClick={setValue}>Flip it!</button>
      </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
};

export default App;
