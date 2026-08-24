import { createFileRoute } from "@tanstack/react-router";
import DeviceDetail from "@/features/devices/device-detail";

export const Route = createFileRoute("/_authenticated/devices/$deviceId")({
	component: DeviceDetail,
});
