import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { ChainsMap, CHAINS } from "../helpers";

interface IContext {
  chainData: ChainsMap;
}

export const ChainDataContext = createContext<IContext>({} as IContext);

export function ChainDataContextProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const [chainData, setChainData] = useState<ChainsMap>({});

  const loadChainData = async () => {
    setChainData(CHAINS);
  };

  useEffect(() => {
    loadChainData();
  }, []);

  return (
    <ChainDataContext.Provider
      value={{
        chainData,
      }}
    >
      {children}
    </ChainDataContext.Provider>
  );
}

export function useChainData() {
  const context = useContext(ChainDataContext);
  if (context === undefined) {
    throw new Error(
      "useChainData must be used within a ChainDataContextProvider"
    );
  }
  return context;
}
