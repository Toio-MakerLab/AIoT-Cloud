import { useDevices } from "../context/devices-context";
import { AddDeviceDialog } from "./add-device-dialog";
import { DevicesDeleteDialog } from "./devices-delete-dialog";

export function DevicesDialogs() {
	const { open, setOpen, currentRow, setCurrentRow } = useDevices();

	return (
		<>
			<AddDeviceDialog
				key="device-add"
				open={open === "add"}
				onOpenChange={(state) => setOpen(state ? "add" : null)}
			/>

			{currentRow && (
				<DevicesDeleteDialog
					key={`device-delete-${currentRow.id}`}
					open={open === "delete"}
					onOpenChange={(state) => {
						if (!state) {
							setOpen(null);
							setTimeout(() => setCurrentRow(null), 300);
						}
					}}
					currentRow={currentRow}
				/>
			)}
		</>
	);
}
