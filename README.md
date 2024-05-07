# WalletConnect Reef React dApp

Sample dApp using `@reef-chain/util-lib` to connect Reef's Mobile App with WalletConnect.

The app uses `@web3modal/standalone` to stablish connection with the Mobile App. The connection data is then passed to the `injectWcAsExtension` function to inject a wrapper interface into the Window object. Finally, the `web3Enable` function is executed in order to fetch all available extensions compatible with Reef Chain.

## Running locally

Install the app's dependencies:

```bash
yarn
```
Run app

```bash
yarn start
```