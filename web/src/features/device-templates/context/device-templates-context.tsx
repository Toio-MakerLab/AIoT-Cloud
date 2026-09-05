import React, { useState } from 'react';
import useDialogState from '@/hooks/use-dialog-state';
import type { DeviceTemplate } from '../data/schema';

type DeviceTemplatesDialogType = 'add' | 'edit' | 'delete' | 'firmware';

interface DeviceTemplatesContextType {
  open: DeviceTemplatesDialogType | null;
  setOpen: (str: DeviceTemplatesDialogType | null) => void;
  currentRow: DeviceTemplate | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<DeviceTemplate | null>>;
}

const DeviceTemplatesContext = React.createContext<DeviceTemplatesContextType | null>(null);

interface Props {
  children: React.ReactNode;
}

export default function DeviceTemplatesProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<DeviceTemplatesDialogType>(null);
  const [currentRow, setCurrentRow] = useState<DeviceTemplate | null>(null);

  return <DeviceTemplatesContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>{children}</DeviceTemplatesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDeviceTemplates = () => {
  const deviceTemplatesContext = React.useContext(DeviceTemplatesContext);

  if (!deviceTemplatesContext) {
    throw new Error('useDeviceTemplates has to be used within <DeviceTemplatesContext>');
  }

  return deviceTemplatesContext;
};
