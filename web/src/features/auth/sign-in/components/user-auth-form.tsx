import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
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
import { useAuthStore } from "@/stores/authStore";

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>;

const formSchema = z.object({
	usernameOrEmail: z
		.string()
		.min(1, { message: "Please enter your username or email" }),
	password: z.string().min(1, {
		message: "Please enter your password",
	}),
});

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
	const navigate = useNavigate();
	const { setAccessToken, setUser } = useAuthStore((state) => state.auth);
	const [isLoading, startTransition] = useTransition();

	const { mutate: login, isPending } = useMutation({
		mutationFn: authApi.login,
		onSuccess: (res, variables) => {
			if (res.error !== 0) {
				if (res.message === "error.emailNotVerified") {
					const email = variables.usernameOrEmail.includes("@")
						? variables.usernameOrEmail
						: undefined;

					toast.error("Please verify your email before signing in", {
						action: email
							? {
									label: "Resend email",
									onClick: () => {
										void authApi
											.resendVerification({ email })
											.then(() => toast.success("Verification email sent"))
											.catch(() => toast.error("Failed to resend email"));
									},
								}
							: undefined,
					});
					return;
				}

				if (res.message === "error.userDeactivated") {
					toast.error("Your account has been deactivated");
					return;
				}

				toast.error("Invalid username/email or password");
				return;
			}

			setAccessToken(res.data.token.accessToken);
			setUser({
				...res.data.user,
				fullName:
					[res.data.user.firstName, res.data.user.lastName]
						.filter(Boolean)
						.join(" ") || res.data.user.username,
				picture: res.data.user.avatar,
			});
			toast.success("Login successful");
			navigate({ to: "/" });
		},
		onError: () => {
			toast.error("Invalid username/email or password");
		},
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			usernameOrEmail: "",
			password: "",
		},
	});

	function onSubmit(data: z.infer<typeof formSchema>) {
		startTransition(() => {
			login(data);
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
					name="usernameOrEmail"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username or Email</FormLabel>
							<FormControl>
								<Input placeholder="jdoe or name@example.com" {...field} />
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
							<div className="flex items-center justify-between">
								<FormLabel>Password</FormLabel>
								<Link
									to="/forgot-password"
									className="text-muted-foreground text-sm hover:opacity-75"
								>
									Forgot password?
								</Link>
							</div>
							<FormControl>
								<PasswordInput placeholder="********" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button className="mt-2" disabled={isPending && isLoading}>
					Login
				</Button>
			</form>
		</Form>
	);
}
