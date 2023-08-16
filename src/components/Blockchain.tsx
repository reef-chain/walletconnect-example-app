import React, { PropsWithChildren, FC } from "react";
import styled from "styled-components";

import Asset from "./Asset";
import Button from "./Button";
import Column from "./Column";
import Loader from "./Loader";

import {
  AccountAction,
  ellipseAddress,
  AccountBalances,
  ChainData,
} from "../helpers";
import { fonts } from "../styles";
import { CHAINS } from "../helpers/config";

interface AccountStyleProps {
  rgb: string;
}

const SAccount = styled.div<AccountStyleProps>`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-radius: 8px;
  padding: 8px;
  margin: 5px 0;
  border: ${({ rgb }) => `2px solid rgb(${rgb})`};
  &.active {
    box-shadow: ${({ rgb }) => `0 0 8px rgb(${rgb})`};
  }
`;

const SChain = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  & p {
    font-weight: 600;
  }
  & img {
    border-radius: 50%;
    width: 35px;
    height: 35px;
    margin-right: 10px;
  }
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SFullWidthContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

const SAction = styled(Button as any)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  margin: 12px 0;
  background-color: ${({ rgb }) => `rgb(${rgb})`};
`;

const SBlockchainChildrenContainer = styled(SFullWidthContainer)`
  flex-direction: column;
`;

interface BlockchainProps {
  fetching?: boolean;
  active?: boolean;
  genesisHash: string;
  address?: string;
  onClick?: (chain: string) => void;
  balances?: AccountBalances;
  actions?: AccountAction[];
}

const Blockchain: FC<PropsWithChildren<BlockchainProps>> = (
  props: PropsWithChildren<BlockchainProps>
) => {
  const {
    fetching,
    genesisHash,
    address,
    onClick,
    active,
    balances,
    actions,
  } = props;

  const chain: ChainData = CHAINS[genesisHash];

  if (typeof chain === "undefined") return null;

  const name = chain.name;
  const account =
    typeof address !== "undefined" ? `${chain.id}:${address}` : undefined;
  const assets =
    typeof account !== "undefined" && typeof balances !== "undefined"
      ? balances[account]
      : [];
  return (
    <React.Fragment>
      <SAccount
        rgb={chain.rgb}
        onClick={() => onClick && onClick(props.genesisHash)}
        className={active ? "active" : ""}
      >
        <SChain>
          <img src={chain.logo} alt={name} />
          <p>{name}</p>
        </SChain>
        {!!address && <p>{ellipseAddress(address)}</p>}
        <SBlockchainChildrenContainer>
          {fetching ? (
            <Column center>
              <SContainer>
                <Loader rgb={`rgb(${chain.rgb})`} />
              </SContainer>
            </Column>
          ) : (
            <>
              {!!assets && assets.length ? (
                <SFullWidthContainer>
                  <h6>Balances</h6>
                  <Column center>
                    {assets.map((asset) =>
                      asset.symbol ? (
                        <Asset key={asset.symbol} asset={asset} />
                      ) : null
                    )}
                  </Column>
                </SFullWidthContainer>
              ) : null}
              {address && !!actions && actions.length ? (
                <SFullWidthContainer>
                  <h6>Methods</h6>
                  {actions.map((action) => (
                    <SAction
                      key={action.method}
                      left
                      rgb={chain.rgb}
                      onClick={() => action.callback(genesisHash, address)}
                    >
                      {action.method}
                    </SAction>
                  ))}
                </SFullWidthContainer>
              ) : null}
            </>
          )}
        </SBlockchainChildrenContainer>
      </SAccount>
    </React.Fragment>
  );
};
export default Blockchain;
