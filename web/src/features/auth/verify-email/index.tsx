import { useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api/auth-api";
import AuthLayout from "../auth-layout";

export default function VerifyEmail() {
	const search = useSearch({ from: "/(auth)/verify-email" });
	const [status, setStatus] = useState<"pending" | "success" | "error">(
		"pending",
	);
	const attempted = useRef(false);

	const { mutate: verify, isPending } = useMutation({
		mutationFn: authApi.verifyEmail,
		onSuccess: (res) => setStatus(res.error === 0 ? "success" : "error"),
		onError: () => setStatus("error"),
	});

	const { mutate: resend, isPending: isResending } = useMutation({
		mutationFn: authApi.resendVerification,
		onSuccess: (res) => {
			if (res.error === 0) {
				toast.success("Verification email sent");
			} else {
				toast.error("Failed to resend verification email");
			}
		},
		onError: () => toast.error("Failed to resend verification email"),
	});

	useEffect(() => {
		if (search.email && search.token && !attempted.current) {
			attempted.current = true;
			verify({ email: search.email, token: search.token });
		}
	}, [search.email, search.token, verify]);

	return (
		<AuthLayout>
			<Card className="gap-4">
				<CardHeader>
					<CardTitle className="text-lg tracking-tight">
						Verify your account
					</CardTitle>
					<CardDescription>
						{search.token
							? isPending
								? "Verifying your email..."
								: status === "success"
									? "Your email has been verified. You can now sign in."
									: status === "error"
										? "This verification link is invalid or has expired."
										: null
							: `We sent a verification link to ${search.email ?? "your email"}. Click it to activate your account.`}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{status === "success" ? (
						<Button asChild>
							<Link to="/sign-in">Go to sign in</Link>
						</Button>
					) : (
						search.email && (
							<Button
								variant="outline"
								disabled={isResending}
								onClick={() => resend({ email: search.email! })}
							>
								Resend verification email
							</Button>
						)
					)}
				</CardContent>
			</Card>
		</AuthLayout>
	);
}
