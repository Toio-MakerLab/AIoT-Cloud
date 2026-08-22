import { useDeviceTemplates } from "../context/device-templates-context";
import { DeviceTemplatesActionDialog } from "./device-templates-action-dialog";
import { DeviceTemplatesDeleteDialog } from "./device-templates-delete-dialog";

export function DeviceTemplatesDialogs() {
	const { open, setOpen, currentRow, setCurrentRow } = useDeviceTemplates();
	return (
		<>
			<DeviceTemplatesActionDialog
				key="device-template-add"
				open={open === "add"}
				onOpenChange={() => setOpen("add")}
			/>

			{currentRow && (
				<>
					<DeviceTemplatesActionDialog
						key={`device-template-edit-${currentRow.id}`}
						open={open === "edit"}
						onOpenChange={() => {
							setOpen("edit");
							setTimeout(() => {
								setCurrentRow(null);
							}, 500);
						}}
						currentRow={currentRow}
					/>

					<DeviceTemplatesDeleteDialog
						key={`device-template-delete-${currentRow.id}`}
						open={open === "delete"}
						onOpenChange={() => {
							setOpen("delete");
							setTimeout(() => {
								setCurrentRow(null);
							}, 500);
						}}
						currentRow={currentRow}
					/>
				</>
			)}
		</>
	);
}
