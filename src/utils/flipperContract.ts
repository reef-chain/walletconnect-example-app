import {
  Signer as ReefVMSigner,
  Provider as ReefVMProvider,
} from "@reef-chain/evm-provider";
import { ethers } from "ethers";

export function getFlipperContract(
  signerOrProvider: ReefVMSigner | ReefVMProvider,
  network: string
) {
  const testnetAddress = "0x6bECC47323fcD240F1c856ab3Aa4EFeC5ad63aFE";
  const mainnetAddress = "0x776A169621d6c3d39800dFE22dE7E4779f9C8c40";
  const FlipperAbi = [
    {
      inputs: [
        {
          internalType: "bool",
          name: "initvalue",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "flip",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "get",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  return new ethers.Contract(
    network === "testnet" ? testnetAddress : mainnetAddress,
    FlipperAbi,
    signerOrProvider as any
  );
}

export async function flipIt(signer: ReefVMSigner, network: string) {
  const flipperContract = getFlipperContract(signer, network);
  return await flipperContract.flip();
}

export async function getFlipperValue(
  provider: ReefVMProvider,
  network: string
) {
  const flipperContract = getFlipperContract(provider, network);
  return await flipperContract.get();
}
