import { IconBan } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useRevokeDeviceSecretMutation } from "../api/queries";
import type { IDeviceSecret } from "../api/types";

interface Props {
	data: IDeviceSecret[];
}

export function DeviceSecretsTable({ data }: Props) {
	const revokeDeviceSecret = useRevokeDeviceSecretMutation();

	const handleRevoke = async (id: string) => {
		try {
			await revokeDeviceSecret.mutateAsync(id);
			toast.success("Device secret revoked");
		} catch {
			// Error toast is already shown by the global mutation error handler (see main.tsx).
		}
	};

	if (data.length === 0) {
		return (
			<p className="text-muted-foreground py-8 text-center text-sm">
				No device secrets yet. Create one to let device firmware authenticate.
			</p>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Label</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Created</TableHead>
					<TableHead className="w-0" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{data.map((secret) => {
					const isRevoked = !!secret.revokedAt;

					return (
						<TableRow key={secret.id}>
							<TableCell className="font-medium">
								{secret.label || (
									<span className="text-muted-foreground">Untitled</span>
								)}
							</TableCell>
							<TableCell>
								<Badge variant={isRevoked ? "outline" : "default"}>
									{isRevoked ? "Revoked" : "Active"}
								</Badge>
							</TableCell>
							<TableCell className="text-muted-foreground">
								{formatDistanceToNow(new Date(secret.createdAt), {
									addSuffix: true,
								})}
							</TableCell>
							<TableCell>
								{!isRevoked && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => void handleRevoke(secret.id)}
										disabled={revokeDeviceSecret.isPending}
									>
										<IconBan className="mr-1 h-4 w-4" />
										Revoke
									</Button>
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
