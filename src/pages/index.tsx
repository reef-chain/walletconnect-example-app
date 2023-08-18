import type { NextPage } from "next";
import React, { useEffect, useState } from "react";
import Banner from "../components/Banner";
import Blockchain from "../components/Blockchain";
import Column from "../components/Column";
import Dropdown from "../components/Dropdown";
import Header from "../components/Header";
import Modal from "../components/Modal";
import { AccountAction, initProviders, DEFAULT_REEF_METHODS } from "../helpers";
import RequestModal from "../modals/RequestModal";
import PairingModal from "../modals/PairingModal";
import {
  SAccounts,
  SAccountsContainer,
  SButtonContainer,
  SConnectButton,
  SContent,
  SLanding,
  SLayout,
} from "../components/app";
import { useWalletConnectClient } from "../contexts/ClientContext";
import { useJsonRpc } from "../contexts/JsonRpcContext";

const Home: NextPage = () => {
  const [modal, setModal] = useState("");

  const closeModal = () => setModal("");
  const openPairingModal = () => setModal("pairing");
  const openRequestModal = () => setModal("request");

  // Initialize the WalletConnect client.
  const {
    client,
    pairings,
    session,
    connect,
    disconnect,
    relayerRegion,
    accounts,
    isInitializing,
    setRelayerRegion,
  } = useWalletConnectClient();

  // Use `JsonRpcContext` to provide us with relevant RPC methods and states.
  const {
    reefRpc,
    isRpcRequestPending,
    rpcResult,
  } = useJsonRpc();

  // Initialize RPC providers.
  useEffect(() => {
    initProviders();
  }, []);

  // Close the pairing modal after a session is established.
  useEffect(() => {
    if (session && modal === "pairing") {
      closeModal();
    }
  }, [session, modal]);

  const onConnect = () => {
    if (typeof client === "undefined") {
      throw new Error("WalletConnect is not initialized");
    }
    // Suggest existing pairings (if any).
    if (pairings.length) {
      openPairingModal();
    } else {
      // If no existing pairings are available, trigger `WalletConnectClient.connect`.
      connect();
    }
  };

  async function emit() {
    if (typeof client === "undefined") {
      throw new Error("WalletConnect is not initialized");
    }

    await client.emit({
      topic: session?.topic || "",
      event: { 
        name: "accountsChanged", 
        data: ["reef:7834781d38e4798d548e34ec947d19de:5aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"] 
      },
      chainId: "reef:7834781d38e4798d548e34ec947d19de",
    });
  }

  const getReefActions = (): AccountAction[] => {
    const onSignTransaction = async (reference: string, address: string) => {
      openRequestModal();
      await reefRpc.testSignTransaction(reference, address);
    };
    const onSignMessage = async (reference: string, address: string) => {
      openRequestModal();
      await reefRpc.testSignMessage(reference, address);
    };
    return [
      {
        method: DEFAULT_REEF_METHODS.REEF_SIGN_TRANSACTION,
        callback: onSignTransaction,
      },
      {
        method: DEFAULT_REEF_METHODS.REEF_SIGN_MESSAGE,
        callback: onSignMessage,
      },
    ];
  };

  // Renders the appropriate model for the given request that is currently in-flight.
  const renderModal = () => {
    switch (modal) {
      case "pairing":
        if (typeof client === "undefined") {
          throw new Error("WalletConnect is not initialized");
        }
        return <PairingModal pairings={pairings} connect={connect} />;
      case "request":
        return (
          <RequestModal pending={isRpcRequestPending} result={rpcResult} />
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    return !accounts.length ? (
      <SLanding center>
        <Banner />
        <SButtonContainer>
          <SConnectButton left onClick={onConnect}>
            {"Connect"}
          </SConnectButton>
          <Dropdown
            relayerRegion={relayerRegion}
            setRelayerRegion={setRelayerRegion}
          />
        </SButtonContainer>
      </SLanding>
    ) : (
      <SAccountsContainer>
        <h3>Accounts</h3>
        <SAccounts>
          {accounts.map((account) => {
            const [_namespace, reference, address] = account.split(":");
            return (
              <Blockchain
                key={account}
                active={true}
                address={address}
                reference={reference}
                actions={getReefActions()}
              />
            );
          })}
        </SAccounts>
      </SAccountsContainer>
    );
  };

  return (
    <SLayout>
      <Column maxWidth={1000} spanHeight>
        <Header
          disconnect={disconnect}
          session={session}
          emit={emit}
        />
        <SContent>{isInitializing ? "Loading..." : renderContent()}</SContent>
      </Column>
      <Modal show={!!modal} closeModal={closeModal}>
        {renderModal()}
      </Modal>
    </SLayout>
  );
};

export default Home;
