import React from "react";
import Identicon from '@polkadot/react-identicon';
import { ReefAccount, toAddressShortDisplay, toReefAmount } from './utils/util';

interface Account {
  account: ReefAccount
  onClick?: () => void;
}

const Account = ({ account, onClick }: Account): JSX.Element => (
  <div onClick={onClick} className="account">
    <div className="logo">
      <Identicon value={account.address} size={44} theme="substrate" />
    </div>
    <div className="content">
      <div className="name">{ account.name }</div>
      <div>Native address: { toAddressShortDisplay(account.address) }</div>
      <div>EVM address: { toAddressShortDisplay(account.evmAddress) }</div>
      <div>Balance: { toReefAmount(account.balance) }</div>
    </div>
  </div>
);

export default Account;
