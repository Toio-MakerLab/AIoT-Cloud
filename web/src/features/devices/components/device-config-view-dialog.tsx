import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getDevicePushChannelLabel } from "../data/data";
import type { Device } from "../data/schema";

interface Props {
	currentRow: Device;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
	return (
		<div className="grid grid-cols-3 gap-x-4 text-sm">
			<span className="text-muted-foreground">{label}</span>
			<span className="col-span-2 break-all font-mono">{value || "—"}</span>
		</div>
	);
}

export function DeviceConfigViewDialog({
	currentRow,
	open,
	onOpenChange,
}: Props) {
	const { config, pushChannel } = currentRow;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader className="text-left">
					<DialogTitle>Device Config</DialogTitle>
					<DialogDescription>
						Current network parameters served from the boot-config endpoint.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-3">
					<Row label="API Endpoint" value={config?.apiEndpoint} />
					<Row
						label="Push Channel"
						value={getDevicePushChannelLabel(pushChannel)}
					/>

					{pushChannel === "MQTT" ? (
						<>
							<Row label="Broker" value={config?.mqtt?.broker} />
							<Row
								label="Port"
								value={
									config?.mqtt?.port ? String(config.mqtt.port) : undefined
								}
							/>
							<Row label="Username" value={config?.mqtt?.username} />
							<Row
								label="Telemetry Topic"
								value={config?.mqtt?.topics?.telemetry}
							/>
							<Row
								label="Command Topic"
								value={config?.mqtt?.topics?.command}
							/>
							<Row label="Status Topic" value={config?.mqtt?.topics?.status} />
						</>
					) : null}

					{pushChannel === "HTTP" ? (
						<Row label="Push URL" value={config?.http?.url} />
					) : null}

					{pushChannel === "KAFKA" ? (
						<>
							<Row label="Brokers" value={config?.kafka?.brokers} />
							<Row label="Topic" value={config?.kafka?.topic} />
							<Row label="Client ID" value={config?.kafka?.clientId} />
						</>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
