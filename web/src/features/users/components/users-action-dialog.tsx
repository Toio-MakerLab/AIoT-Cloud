"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordInput } from "@/components/password-input";
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
import { useIsRoot } from "@/features/account/hooks/use-is-root";
import { generatePassword } from "@/lib/generate-password";
import { useCreateUserMutation, useUpdateUserMutation } from "../api/queries";
import { getAssignableRoleTypes } from "../data/data";
import type { User } from "../data/schema";

const formSchema = z
	.object({
		firstName: z.string().min(1, { message: "First Name is required." }),
		lastName: z.string().min(1, { message: "Last Name is required." }),
		username: z.string().min(1, { message: "Username is required." }),
		phoneNumber: z.string().optional(),
		email: z
			.string()
			.email({ message: "Email is invalid." })
			.optional()
			.or(z.literal("")),
		password: z.string().transform((pwd) => pwd.trim()),
		role: z.string().min(1, { message: "Role is required." }),
		confirmPassword: z.string().transform((pwd) => pwd.trim()),
		isEdit: z.boolean(),
	})
	.superRefine(({ isEdit, password, confirmPassword }, ctx) => {
		if (!isEdit || (isEdit && password !== "")) {
			if (password === "") {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Password is required.",
					path: ["password"],
				});
			}

			if (password.length < 8) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Password must be at least 8 characters long.",
					path: ["password"],
				});
			}

			if (!password.match(/[a-z]/)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Password must contain at least one lowercase letter.",
					path: ["password"],
				});
			}

			if (!password.match(/\d/)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Password must contain at least one number.",
					path: ["password"],
				});
			}

			if (password !== confirmPassword) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Passwords don't match.",
					path: ["confirmPassword"],
				});
			}
		}
	});
type UserForm = z.infer<typeof formSchema>;

interface Props {
	currentRow?: User;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
	const isEdit = !!currentRow;
	const isRoot = useIsRoot();
	const roleTypes = getAssignableRoleTypes(isRoot);
	const createUser = useCreateUserMutation();
	const updateUser = useUpdateUserMutation();
	const isSubmitting = createUser.isPending || updateUser.isPending;
	const form = useForm<UserForm>({
		resolver: zodResolver(formSchema),
		defaultValues: isEdit
			? {
					...currentRow,
					password: "",
					confirmPassword: "",
					isEdit,
				}
			: {
					firstName: "",
					lastName: "",
					username: "",
					email: "",
					role: "",
					phoneNumber: "",
					password: "",
					confirmPassword: "",
					isEdit,
				},
	});

	const onSubmit = async (values: UserForm) => {
		try {
			if (isEdit && currentRow) {
				await updateUser.mutateAsync({
					id: currentRow.id,
					data: {
						firstName: values.firstName,
						lastName: values.lastName,
						username: values.username,
						phoneNumber: values.phoneNumber,
						role: values.role,
						...(values.email ? { email: values.email } : {}),
						...(values.password ? { password: values.password } : {}),
					},
				});
				toast.success("User updated");
			} else {
				await createUser.mutateAsync({
					firstName: values.firstName,
					lastName: values.lastName,
					username: values.username,
					phoneNumber: values.phoneNumber,
					password: values.password,
					role: values.role,
					...(values.email ? { email: values.email } : {}),
				});
				toast.success("User created");
			}
			form.reset();
			onOpenChange(false);
		} catch {
			// Error toast is already shown by the global mutation error handler (see main.tsx).
		}
	};

	const isPasswordTouched = !!form.formState.dirtyFields.password;

	const handleGeneratePassword = () => {
		const generated = generatePassword();
		form.setValue("password", generated, {
			shouldValidate: true,
			shouldDirty: true,
		});
		form.setValue("confirmPassword", generated, {
			shouldValidate: true,
			shouldDirty: true,
		});
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
					<DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
					<DialogDescription>
						{isEdit ? "Update the user here. " : "Create new user here. "}
						Click save when you&apos;re done.
					</DialogDescription>
				</DialogHeader>
				<div className="-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4">
					<Form {...form}>
						<form
							id="user-form"
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-4 p-0.5"
						>
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
										<FormLabel className="col-span-2 text-right">
											First Name
										</FormLabel>
										<FormControl>
											<Input
												placeholder="John"
												className="col-span-4"
												autoComplete="off"
												{...field}
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
										<FormLabel className="col-span-2 text-right">
											Last Name
										</FormLabel>
										<FormControl>
											<Input
												placeholder="Doe"
												className="col-span-4"
												autoComplete="off"
												{...field}
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
										<FormLabel className="col-span-2 text-right">
											Username
										</FormLabel>
										<FormControl>
											<Input
												placeholder="john_doe"
												className="col-span-4"
												{...field}
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
										<FormLabel className="col-span-2 text-right">
											Email (optional)
										</FormLabel>
										<FormControl>
											<Input
												placeholder="john.doe@gmail.com"
												className="col-span-4"
												{...field}
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phoneNumber"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
										<FormLabel className="col-span-2 text-left">
											Phone Number (optional)
										</FormLabel>
										<FormControl>
											<Input
												placeholder="+123456789"
												className="col-span-4"
												{...field}
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
										<FormLabel className="col-span-2 text-right">
											Role
										</FormLabel>
										<SelectDropdown
											defaultValue={field.value}
											onValueChange={field.onChange}
											placeholder="Select a role"
											className="col-span-4"
											items={roleTypes.map(({ label, value }) => ({
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
								name="password"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
										<FormLabel className="col-span-2 text-right">
											Password
										</FormLabel>
										<div className="col-span-4 flex gap-2">
											<FormControl>
												<PasswordInput
													placeholder="e.g., S3cur3P@ssw0rd"
													className="flex-1"
													{...field}
												/>
											</FormControl>
											<Button
												type="button"
												variant="outline"
												onClick={handleGeneratePassword}
											>
												Generate
											</Button>
										</div>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
										<FormLabel className="col-span-2 text-right">
											Confirm Password
										</FormLabel>
										<FormControl>
											<PasswordInput
												disabled={!isPasswordTouched}
												placeholder="e.g., S3cur3P@ssw0rd"
												className="col-span-4"
												{...field}
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</div>
				<DialogFooter>
					<Button type="submit" form="user-form" disabled={isSubmitting}>
						Save changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
