import React, { useState } from 'react';
import useDialogState from '@/hooks/use-dialog-state';
import type { Factory } from '../data/schema';

type FactoriesDialogType = 'add' | 'edit' | 'delete';

interface FactoriesContextType {
  open: FactoriesDialogType | null;
  setOpen: (str: FactoriesDialogType | null) => void;
  currentRow: Factory | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Factory | null>>;
}

const FactoriesContext = React.createContext<FactoriesContextType | null>(null);

interface Props {
  children: React.ReactNode;
}

export default function FactoriesProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<FactoriesDialogType>(null);
  const [currentRow, setCurrentRow] = useState<Factory | null>(null);

  return <FactoriesContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>{children}</FactoriesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFactories = () => {
  const factoriesContext = React.useContext(FactoriesContext);

  if (!factoriesContext) {
    throw new Error('useFactories has to be used within <FactoriesContext>');
  }

  return factoriesContext;
};
