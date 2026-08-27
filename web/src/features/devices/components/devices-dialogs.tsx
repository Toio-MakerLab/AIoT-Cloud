import { useDevices } from "../context/devices-context";
import { AddDeviceDialog } from "./add-device-dialog";
import { DeviceConfigDialog } from "./device-config-dialog";
import { DeviceConfigViewDialog } from "./device-config-view-dialog";
import { DevicesDeleteDialog } from "./devices-delete-dialog";

export function DevicesDialogs() {
	const {
		open,
		setOpen,
		currentRow,
		setCurrentRow,
		prefillDeviceId,
		setPrefillDeviceId,
	} = useDevices();

	return (
		<>
			<AddDeviceDialog
				key="device-add"
				open={open === "add"}
				initialDeviceId={prefillDeviceId}
				onOpenChange={(state) => {
					setOpen(state ? "add" : null);
					if (!state) {
						setTimeout(() => setPrefillDeviceId(null), 300);
					}
				}}
			/>

			{currentRow && (
				<>
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

					<DeviceConfigDialog
						key={`device-config-${currentRow.id}`}
						open={open === "config"}
						onOpenChange={(state) => {
							if (!state) {
								setOpen(null);
								setTimeout(() => setCurrentRow(null), 300);
							}
						}}
						currentRow={currentRow}
					/>

					<DeviceConfigViewDialog
						key={`device-config-view-${currentRow.id}`}
						open={open === "view-config"}
						onOpenChange={(state) => {
							if (!state) {
								setOpen(null);
								setTimeout(() => setCurrentRow(null), 300);
							}
						}}
						currentRow={currentRow}
					/>
				</>
			)}
		</>
	);
}
