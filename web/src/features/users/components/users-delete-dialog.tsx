"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeleteUserMutation } from "../api/queries";
import type { User } from "../data/schema";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentRow: User;
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: Props) {
	const [value, setValue] = useState("");
	const deleteUser = useDeleteUserMutation();

	const handleDelete = async () => {
		if (value.trim() !== currentRow.username) return;

		try {
			await deleteUser.mutateAsync(currentRow.id);
			onOpenChange(false);
			toast.success("User deleted");
		} catch {
			// Error toast is already shown by the global mutation error handler (see main.tsx).
		}
	};

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			handleConfirm={handleDelete}
			disabled={value.trim() !== currentRow.username || deleteUser.isPending}
			title={
				<span className="text-destructive">
					<IconAlertTriangle
						className="stroke-destructive mr-1 inline-block"
						size={18}
					/>{" "}
					Delete User
				</span>
			}
			desc={
				<div className="space-y-4">
					<p className="mb-2">
						Are you sure you want to delete{" "}
						<span className="font-bold">{currentRow.username}</span>?
						<br />
						This action will permanently remove the user with the role of{" "}
						<span className="font-bold">{currentRow.role.toUpperCase()}</span>{" "}
						from the system. This cannot be undone.
					</p>

					<Label className="my-2">
						Username:
						<Input
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder="Enter username to confirm deletion."
						/>
					</Label>

					<Alert variant="destructive">
						<AlertTitle>Warning!</AlertTitle>
						<AlertDescription>
							Please be carefull, this operation can not be rolled back.
						</AlertDescription>
					</Alert>
				</div>
			}
			confirmText="Delete"
			destructive
		/>
	);
}
