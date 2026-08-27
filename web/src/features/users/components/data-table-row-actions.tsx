import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { IconEdit } from "@tabler/icons-react";
import type { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsers } from "../context/users-context";
import type { User } from "../data/schema";
import { useIsUserAdmin } from "../hooks/use-is-user-admin";

interface DataTableRowActionsProps {
	row: Row<User>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
	const { setOpen, setCurrentRow } = useUsers();
	// Mutating routes (POST/PATCH) are ADMIN/ROOT only on the backend (see
	// user.controller.ts @Auth decorators). No useCanAccess/permission-map
	// endpoint exists for this backend, so gate directly on role.
	const isAdmin = useIsUserAdmin();

	if (!isAdmin) return null;

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
				>
					<DotsHorizontalIcon className="h-4 w-4" />
					<span className="sr-only">Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[160px]">
				<DropdownMenuItem
					onClick={() => {
						setCurrentRow(row.original);
						setOpen("edit");
					}}
				>
					Edit
					<IconEdit className="ml-auto" size={16} />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
