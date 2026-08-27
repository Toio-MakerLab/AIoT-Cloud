import { IconQrcode } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useDevices } from "../context/devices-context";
import { useIsDeviceAdmin } from "../hooks/use-is-device-admin";

export function DevicesPrimaryButtons() {
	const { setOpen } = useDevices();
	const isAdmin = useIsDeviceAdmin();

	if (!isAdmin) return null;

	return (
		<div className="flex gap-2">
			<Button className="space-x-1" onClick={() => setOpen("add")}>
				<span>Add Device</span> <IconQrcode size={18} />
			</Button>
		</div>
	);
}
