import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type HTMLAttributes, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authApi } from "@/features/auth/api/auth-api";
import { cn } from "@/lib/utils";

type SignUpFormProps = HTMLAttributes<HTMLFormElement>;

const formSchema = z
	.object({
		username: z
			.string()
			.min(3, { message: "Username must be at least 3 characters" })
			.max(32, { message: "Username must be at most 32 characters" }),
		firstName: z.string().min(1, { message: "Please enter your first name" }),
		lastName: z.string().min(1, { message: "Please enter your last name" }),
		email: z
			.string()
			.min(1, { message: "Please enter your email" })
			.email({ message: "Invalid email address" }),
		password: z
			.string()
			.min(1, {
				message: "Please enter your password",
			})
			.min(6, {
				message: "Password must be at least 6 characters long",
			}),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match.",
		path: ["confirmPassword"],
	});

export function SignUpForm({ className, ...props }: SignUpFormProps) {
	const navigate = useNavigate();
	const [isLoading, startTransition] = useTransition();

	const { mutate: register, isPending } = useMutation({
		mutationFn: authApi.register,
		onSuccess: (res, variables) => {
			if (res.error !== 0) {
				if (res.message === "error.userAlreadyExists") {
					toast.error("Username or email already in use");
					return;
				}
				toast.error("Failed to create account");
				return;
			}

			toast.success("Account created — check your email to verify it");
			navigate({
				to: "/verify-email",
				search: { email: variables.email },
			});
		},
		onError: () => {
			toast.error("Failed to create account");
		},
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: "",
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	function onSubmit(data: z.infer<typeof formSchema>) {
		startTransition(() => {
			register(data);
		});
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn("grid gap-3", className)}
				{...props}
			>
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input placeholder="johndoe" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-2 gap-3">
					<FormField
						control={form.control}
						name="firstName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>First name</FormLabel>
								<FormControl>
									<Input placeholder="John" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="lastName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Last name</FormLabel>
								<FormControl>
									<Input placeholder="Doe" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input placeholder="name@example.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<PasswordInput placeholder="********" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Confirm Password</FormLabel>
							<FormControl>
								<PasswordInput placeholder="********" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button className="mt-2" disabled={isPending && isLoading}>
					Create Account
				</Button>
			</form>
		</Form>
	);
}
