"use client";

import { IconShieldCog, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsRoot } from "@/features/account/hooks/use-is-root";
import {
	useAssignUserRoleMutation,
	useRevokeUserRoleMutation,
	useUserRolesQuery,
} from "../api/queries";
import { getAssignableRoleTypes } from "../data/data";
import type { User } from "../data/schema";

interface Props {
	currentRow: User;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UsersRolesDialog({ currentRow, open, onOpenChange }: Props) {
	const [selectedRole, setSelectedRole] = useState<string | undefined>(
		undefined,
	);
	const isRoot = useIsRoot();
	const { data, isPending } = useUserRolesQuery(currentRow.id);
	const assignRole = useAssignUserRoleMutation(currentRow.id);
	const revokeRole = useRevokeUserRoleMutation(currentRow.id);

	const roles = data?.data ?? [];
	const availableRoles = getAssignableRoleTypes(isRoot).filter(
		({ value }) => !roles.includes(value),
	);

	const handleAssign = async () => {
		if (!selectedRole) return;
		try {
			await assignRole.mutateAsync(selectedRole);
			toast.success(`Role ${selectedRole} assigned`);
			setSelectedRole(undefined);
		} catch {
			// Error toast is already shown by the global mutation error handler (see main.tsx).
		}
	};

	const handleRevoke = async (role: string) => {
		try {
			await revokeRole.mutateAsync(role);
			toast.success(`Role ${role} revoked`);
		} catch {
			// Error toast is already shown by the global mutation error handler (see main.tsx).
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(state) => {
				setSelectedRole(undefined);
				onOpenChange(state);
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="text-left">
					<DialogTitle className="flex items-center gap-2">
						<IconShieldCog /> Manage Roles
					</DialogTitle>
					<DialogDescription>
						Grant or revoke roles for{" "}
						<span className="font-medium">{currentRow.username}</span>, in
						addition to their default role of{" "}
						<span className="font-medium">{currentRow.role}</span>.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{isPending ? (
						<Skeleton className="h-8 w-full" />
					) : roles.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{roles.map((role) => (
								<Badge key={role} variant="secondary" className="gap-1 pr-1">
									{role}
									<button
										type="button"
										onClick={() => handleRevoke(role)}
										disabled={revokeRole.isPending}
										className="hover:bg-muted-foreground/20 rounded-sm"
									>
										<IconX size={12} />
									</button>
								</Badge>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">
							No extra roles assigned.
						</p>
					)}

					<div className="flex gap-2">
						<Select value={selectedRole} onValueChange={setSelectedRole}>
							<SelectTrigger className="flex-1">
								<SelectValue placeholder="Select a role to assign" />
							</SelectTrigger>
							<SelectContent>
								{availableRoles.map(({ label, value }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							type="button"
							disabled={!selectedRole || assignRole.isPending}
							onClick={handleAssign}
						>
							Assign
						</Button>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
