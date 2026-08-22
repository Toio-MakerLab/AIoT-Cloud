import {
	IconCpu,
	IconDeviceUnknown,
	IconRouter,
	IconServer2,
} from "@tabler/icons-react";
import type { DeviceTemplateType } from "./schema";

export const deviceTemplateTypes = [
	{ label: "Sensor Node", value: "SENSOR_NODE", icon: IconCpu },
	{ label: "Relay Node", value: "RELAY_NODE", icon: IconRouter },
	{ label: "Gateway", value: "GATEWAY", icon: IconServer2 },
	{ label: "Other", value: "OTHER", icon: IconDeviceUnknown },
] as const;

export const activeStatuses = [
	{ label: "Active", value: "active" },
	{ label: "Inactive", value: "inactive" },
] as const;

export const activeBadgeClasses = new Map<boolean, string>([
	[true, "bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200"],
	[false, "bg-neutral-300/40 border-neutral-300"],
]);

export function getDeviceTemplateTypeMeta(type: DeviceTemplateType) {
	return deviceTemplateTypes.find((t) => t.value === type);
}
