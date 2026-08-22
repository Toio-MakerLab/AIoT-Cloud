import { IconMailPlus, IconUserPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { RESOURCES } from "@/features/account/api/resources";
import { useCanAccess } from "@/features/account/hooks/use-can-access";
import { useUsers } from "../context/users-context";

export function UsersPrimaryButtons() {
	const { setOpen } = useUsers();
	const canCreate = useCanAccess(RESOURCES.ACCOUNT, "create");

	if (!canCreate) return null;

	return (
		<div className="flex gap-2">
			<Button
				variant="outline"
				className="space-x-1"
				onClick={() => setOpen("invite")}
			>
				<span>Invite User</span> <IconMailPlus size={18} />
			</Button>
			<Button className="space-x-1" onClick={() => setOpen("add")}>
				<span>Add User</span> <IconUserPlus size={18} />
			</Button>
		</div>
	);
}
