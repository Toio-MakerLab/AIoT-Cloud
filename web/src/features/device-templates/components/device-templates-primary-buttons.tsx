import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useDeviceTemplates } from "../context/device-templates-context";
import { useIsDeviceTemplateAdmin } from "../hooks/use-is-device-template-admin";

export function DeviceTemplatesPrimaryButtons() {
	const { setOpen } = useDeviceTemplates();
	const isAdmin = useIsDeviceTemplateAdmin();

	if (!isAdmin) return null;

	return (
		<div className="flex gap-2">
			<Button className="space-x-1" onClick={() => setOpen("add")}>
				<span>Add Template</span> <IconPlus size={18} />
			</Button>
		</div>
	);
}
