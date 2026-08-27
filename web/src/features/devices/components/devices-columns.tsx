import {
	IconDotsVertical,
	IconEye,
	IconSettings,
	IconTrash,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDevices } from "../context/devices-context";
import { deviceStatusColors, getDeviceTemplateTypeLabel } from "../data/data";
import type { Device } from "../data/schema";
import { useIsDeviceAdmin } from "../hooks/use-is-device-admin";
import { DataTableColumnHeader } from "./data-table-column-header";

function DeviceRowActions({ row }: { row: { original: Device } }) {
	const { setOpen, setCurrentRow } = useDevices();
	// Edit Config / Delete hit ADMIN/ROOT-only backend routes (see
	// device.controller.ts @Auth decorators) — USER accounts keep View
	// Config only.
	const isAdmin = useIsDeviceAdmin();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="data-[state=open]:bg-muted h-8 w-8 p-0"
				>
					<IconDotsVertical className="h-4 w-4" />
					<span className="sr-only">Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[170px]">
				<DropdownMenuItem
					onClick={() => {
						setCurrentRow(row.original);
						setOpen("view-config");
					}}
				>
					View Config
					<IconEye className="ml-auto h-4 w-4" />
				</DropdownMenuItem>
				{isAdmin && (
					<>
						<DropdownMenuItem
							onClick={() => {
								setCurrentRow(row.original);
								setOpen("config");
							}}
						>
							Edit Config
							<IconSettings className="ml-auto h-4 w-4" />
						</DropdownMenuItem>
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={() => {
								setCurrentRow(row.original);
								setOpen("delete");
							}}
						>
							Delete
							<IconTrash className="ml-auto h-4 w-4" />
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export const columns: ColumnDef<Device>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Name" />
		),
		cell: ({ row }) => (
			<Link
				to="/devices/$deviceId"
				params={{ deviceId: row.original.id }}
				className="w-fit text-nowrap font-medium hover:underline"
			>
				{row.getValue("name")}
			</Link>
		),
		enableHiding: false,
	},
	{
		accessorKey: "deviceId",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Device ID" />
		),
		cell: ({ row }) => (
			<div className="text-muted-foreground font-mono text-xs">
				{row.getValue("deviceId")}
			</div>
		),
	},
	{
		id: "template",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Template" />
		),
		cell: ({ row }) => {
			const { template } = row.original;

			if (!template) {
				return <span className="text-muted-foreground">—</span>;
			}

			return (
				<div className="flex flex-col">
					<span>{template.name}</span>
					<span className="text-muted-foreground text-xs">
						{getDeviceTemplateTypeLabel(template.type)}
					</span>
				</div>
			);
		},
		enableSorting: false,
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const { status } = row.original;
			const badgeColor = deviceStatusColors.get(status);

			return (
				<Badge variant="outline" className={cn("capitalize", badgeColor)}>
					{status.toLowerCase()}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "lastSeenAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Last Seen" />
		),
		cell: ({ row }) => {
			const { lastSeenAt } = row.original;

			if (!lastSeenAt) {
				return <span className="text-muted-foreground">Never</span>;
			}

			return (
				<span>{formatDistanceToNow(lastSeenAt, { addSuffix: true })}</span>
			);
		},
	},
	{
		id: "actions",
		cell: DeviceRowActions,
	},
];
