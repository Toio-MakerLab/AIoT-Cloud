import { zodResolver } from "@hookform/resolvers/zod";
import { IconBrandFacebook, IconBrandGithub } from "@tabler/icons-react";
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
	username: z.string().min(1, { message: "Please enter your username" }),
	password: z
		.string()
		.min(1, {
			message: "Please enter your password",
		})
		.min(7, {
			message: "Password must be at least 7 characters long",
		}),
});

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
	const navigate = useNavigate();
	const { setAccessToken, setRefreshToken, setUser } = useAuthStore(
		(state) => state.auth,
	);
	const [isLoading, startTransition] = useTransition();

	const { mutate: login, isPending } = useMutation({
		mutationFn: authApi.login,
		onSuccess: (res) => {
			setAccessToken(res.data.accessToken);
			setRefreshToken(res.data.refreshToken);
			setUser(res.data.user);
			toast.success("Login successful");
			navigate({ to: "/" });
		},
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	function onSubmit(data: z.infer<typeof formSchema>) {
		startTransition(() => {
			login({
				username: data.username,
				password: data.password,
			});
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
								<Input placeholder="Enter your username" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem className="relative">
							<FormLabel>Password</FormLabel>
							<FormControl>
								<PasswordInput placeholder="********" {...field} />
							</FormControl>
							<FormMessage />
							<Link
								disabled={true}
								to="/forgot-password"
								className="text-muted-foreground absolute -top-0.5 right-0 text-sm font-medium hover:opacity-75 cursor-pointer"
							>
								Forgot password?
							</Link>
						</FormItem>
					)}
				/>
				<Button className="mt-2" disabled={isPending && isLoading}>
					Login
				</Button>

				<div className="relative my-2">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background text-muted-foreground px-2">
							Or continue with
						</span>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<Button variant="outline" type="button" disabled={true}>
						<IconBrandGithub className="h-4 w-4" /> GitHub
					</Button>
					<Button variant="outline" type="button" disabled={true}>
						<IconBrandFacebook className="h-4 w-4" /> Facebook
					</Button>
				</div>
			</form>
		</Form>
	);
}
