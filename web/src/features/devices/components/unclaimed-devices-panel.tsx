import { IconPlus } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useUnclaimedDevicesQuery } from "../api/queries";
import { useDevices } from "../context/devices-context";

export function UnclaimedDevicesPanel() {
	const { data } = useUnclaimedDevicesQuery();
	const { setOpen, setPrefillDeviceId } = useDevices();
	const unclaimedDevices = data?.data ?? [];

	if (unclaimedDevices.length === 0) {
		return null;
	}

	const handleRegister = (deviceId: string) => {
		setPrefillDeviceId(deviceId);
		setOpen("add");
	};

	return (
		<Card className="mb-4">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					Unclaimed Devices
					<Badge variant="secondary">{unclaimedDevices.length}</Badge>
				</CardTitle>
				<CardDescription>
					Devices publishing MQTT traffic that aren't registered to any account
					yet. Register one to start managing it.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Device ID</TableHead>
							<TableHead>Last Topic</TableHead>
							<TableHead>Last Seen</TableHead>
							<TableHead className="text-right">Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{unclaimedDevices.map((device) => (
							<TableRow key={device.id}>
								<TableCell className="font-mono text-sm">
									{device.deviceId}
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{device.lastTopic}
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{formatDistanceToNow(device.lastSeenAt, { addSuffix: true })}
								</TableCell>
								<TableCell className="text-right">
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleRegister(device.deviceId)}
									>
										<IconPlus className="size-4" />
										Register
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
