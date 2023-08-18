# WalletConnect Reef React dApp (with standalone v2 client)

## Overview

This is an example implementation of a React dApp (generated via `create-react-app`) based on [react-dapp-v2](https://github.com/WalletConnect/web-examples/tree/main/dapps/react-dapp-v2) sample project, adapted to use Reef chain. It uses the standalone
client for WalletConnect v2 to:

- handle pairings
- manage sessions
- send JSON-RPC requests to a paired wallet

## Running locally

Install the app's dependencies:

```bash
yarn
```

Set up your local environment variables by copying the example into your own `.env.local` file:

```bash
cp .env.local.example .env.local
```

Your `.env.local` now contains the following environment variables:

- `NEXT_PUBLIC_PROJECT_ID` (placeholder) - You can generate your own ProjectId at https://cloud.walletconnect.com
- `NEXT_PUBLIC_RELAY_URL` (already set)

## Develop

```bash
yarn dev
```

## Build

```bash
yarn build
```
