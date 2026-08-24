import { useDevices } from "../context/devices-context";
import { AddDeviceDialog } from "./add-device-dialog";
import { DeviceConfigDialog } from "./device-config-dialog";
import { DeviceConfigViewDialog } from "./device-config-view-dialog";
import { DeviceSecretDialog } from "./device-secret-dialog";
import { DevicesDeleteDialog } from "./devices-delete-dialog";

export function DevicesDialogs() {
	const {
		open,
		setOpen,
		currentRow,
		setCurrentRow,
		deviceSecret,
		setDeviceSecret,
	} = useDevices();

	return (
		<>
			<AddDeviceDialog
				key="device-add"
				open={open === "add"}
				onOpenChange={(state) => setOpen(state ? "add" : null)}
			/>

			<DeviceSecretDialog
				key="device-secret"
				open={open === "secret"}
				onOpenChange={(state) => {
					setOpen(state ? "secret" : null);
					if (!state) setTimeout(() => setDeviceSecret(null), 300);
				}}
				secret={deviceSecret}
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
