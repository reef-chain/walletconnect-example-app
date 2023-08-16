import { ProposalTypes } from "@walletconnect/types";

import { CHAINS, DEFAULT_REEF_EVENTS, DEFAULT_REEF_METHODS } from "./config";

export const getRequiredNamespaces = (
): ProposalTypes.RequiredNamespaces => {
  return {
    reef: {
      methods: Object.values(DEFAULT_REEF_METHODS),
      chains: Object.values(CHAINS).map((chain) => chain.id),
      events: Object.values(DEFAULT_REEF_EVENTS) as any[],
    }
  }
};