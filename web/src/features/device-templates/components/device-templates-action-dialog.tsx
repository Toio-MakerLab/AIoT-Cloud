"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SelectDropdown } from "@/components/select-dropdown";
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
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	useCreateDeviceTemplateMutation,
	useUpdateDeviceTemplateMutation,
} from "../api/queries";
import { deviceTemplateTypes } from "../data/data";
import type { DeviceTemplate } from "../data/schema";
import { deviceTemplateTypeSchema } from "../data/schema";

const formSchema = z.object({
	name: z.string().min(1, { message: "Name is required." }),
	type: deviceTemplateTypeSchema,
	manufacturer: z.string().optional(),
	description: z.string().optional(),
	icon: z.string().optional(),
	isActive: z.boolean(),
});
type DeviceTemplateForm = z.infer<typeof formSchema>;

interface Props {
	currentRow?: DeviceTemplate;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeviceTemplatesActionDialog({
	currentRow,
	open,
	onOpenChange,
}: Props) {
	const isEdit = !!currentRow;
	const createDeviceTemplate = useCreateDeviceTemplateMutation();
	const updateDeviceTemplate = useUpdateDeviceTemplateMutation();
	const isSubmitting =
		createDeviceTemplate.isPending || updateDeviceTemplate.isPending;

	const form = useForm<DeviceTemplateForm>({
		resolver: zodResolver(formSchema),
		defaultValues: isEdit
			? {
					name: currentRow.name,
					type: currentRow.type,
					manufacturer: currentRow.manufacturer ?? "",
					description: currentRow.description ?? "",
					icon: currentRow.icon ?? "",
					isActive: currentRow.isActive,
				}
			: {
					name: "",
					type: "SENSOR_NODE",
					manufacturer: "",
					description: "",
					icon: "",
					isActive: true,
				},
	});

	const onSubmit = async (values: DeviceTemplateForm) => {
		try {
			if (isEdit && currentRow) {
				await updateDeviceTemplate.mutateAsync({
					id: currentRow.id,
					data: values,
				});
				toast.success("Device template updated");
			} else {
				await createDeviceTemplate.mutateAsync(values);
				toast.success("Device template created");
			}
			form.reset();
			onOpenChange(false);
		} catch (error) {
			// The backend returns business failures (e.g. duplicate name) as
			// HTTP 200 with a non-zero `error` code, so they surface here as a
			// thrown Error rather than an AxiosError the global mutation error
			// handler can parse — toast the message explicitly.
			toast.error(error instanceof Error ? error.message : "Something went wrong!");
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(state) => {
				form.reset();
				onOpenChange(state);
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader className="text-left">
					<DialogTitle>{isEdit ? "Edit Template" : "Add Template"}</DialogTitle>
					<DialogDescription>
						{isEdit
							? "Update the device template here."
							: "Create a new device template here."}{" "}
						Click save when you're done.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						id="device-template-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 p-0.5"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
									<FormLabel className="col-span-2 text-right">Name</FormLabel>
									<FormControl className="col-span-4">
										<Input placeholder="Soil Moisture Sensor v2" {...field} />
									</FormControl>
									<FormMessage className="col-span-4 col-start-3" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
									<FormLabel className="col-span-2 text-right">Type</FormLabel>
									<SelectDropdown
										defaultValue={field.value}
										onValueChange={field.onChange}
										placeholder="Select a type"
										className="col-span-4"
										items={deviceTemplateTypes.map(({ label, value }) => ({
											label,
											value,
										}))}
									/>
									<FormMessage className="col-span-4 col-start-3" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="manufacturer"
							render={({ field }) => (
								<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
									<FormLabel className="col-span-2 text-right">
										Manufacturer
									</FormLabel>
									<FormControl className="col-span-4">
										<Input placeholder="Acme Sensors Inc." {...field} />
									</FormControl>
									<FormMessage className="col-span-4 col-start-3" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="icon"
							render={({ field }) => (
								<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
									<FormLabel className="col-span-2 text-right">Icon</FormLabel>
									<FormControl className="col-span-4">
										<Input placeholder="icon key or URL" {...field} />
									</FormControl>
									<FormMessage className="col-span-4 col-start-3" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
									<FormLabel className="col-span-2 text-right">
										Description
									</FormLabel>
									<FormControl className="col-span-4">
										<Textarea
											placeholder="What this template represents..."
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage className="col-span-4 col-start-3" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="isActive"
							render={({ field }) => (
								<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
									<FormLabel className="col-span-2 text-right">Active</FormLabel>
									<FormControl className="col-span-4">
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormMessage className="col-span-4 col-start-3" />
								</FormItem>
							)}
						/>
					</form>
				</Form>
				<DialogFooter>
					<Button type="submit" form="device-template-form" disabled={isSubmitting}>
						Save changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
