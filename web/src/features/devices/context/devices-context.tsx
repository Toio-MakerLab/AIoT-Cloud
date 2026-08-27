import React, { useState } from "react";
import useDialogState from "@/hooks/use-dialog-state";
import type { Device } from "../data/schema";

type DevicesDialogType = "add" | "delete" | "config" | "view-config";

interface DevicesContextType {
	open: DevicesDialogType | null;
	setOpen: (str: DevicesDialogType | null) => void;
	currentRow: Device | null;
	setCurrentRow: React.Dispatch<React.SetStateAction<Device | null>>;
}

const DevicesContext = React.createContext<DevicesContextType | null>(null);

interface Props {
	children: React.ReactNode;
}

export default function DevicesProvider({ children }: Props) {
	const [open, setOpen] = useDialogState<DevicesDialogType>(null);
	const [currentRow, setCurrentRow] = useState<Device | null>(null);

	return (
		<DevicesContext.Provider
			value={{
				open,
				setOpen,
				currentRow,
				setCurrentRow,
			}}
		>
			{children}
		</DevicesContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDevices = () => {
	const devicesContext = React.useContext(DevicesContext);

	if (!devicesContext) {
		throw new Error("useDevices has to be used within <DevicesContext>");
	}

	return devicesContext;
};
