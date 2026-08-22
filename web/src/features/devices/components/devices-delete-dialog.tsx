"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteDeviceMutation } from "../api/queries";
import type { Device } from "../data/schema";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentRow: Device;
}

export function DevicesDeleteDialog({ open, onOpenChange, currentRow }: Props) {
	const [value, setValue] = useState("");
	const deleteDevice = useDeleteDeviceMutation();

	const handleDelete = async () => {
		if (value.trim() !== currentRow.name) return;

		try {
			await deleteDevice.mutateAsync(currentRow.id);
			onOpenChange(false);
			toast.success("Device deleted");
		} catch {
			// Error toast is already shown by the global mutation error handler (see main.tsx).
		}
	};

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			handleConfirm={handleDelete}
			disabled={value.trim() !== currentRow.name || deleteDevice.isPending}
			title={
				<span className="text-destructive">
					<IconAlertTriangle className="stroke-destructive mr-1 inline-block" size={18} />{" "}
					Delete Device
				</span>
			}
			desc={
				<div className="space-y-4">
					<p className="mb-2">
						Are you sure you want to delete{" "}
						<span className="font-bold">{currentRow.name}</span>?
						<br />
						This will permanently remove the device (ID:{" "}
						<span className="font-mono">{currentRow.deviceId}</span>) from your
						account. This cannot be undone.
					</p>

					<Label className="my-2">
						Device name:
						<Input
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder="Enter device name to confirm deletion."
						/>
					</Label>
				</div>
			}
			confirmText="Delete"
			destructive
		/>
	);
}
