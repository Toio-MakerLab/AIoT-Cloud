import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import AuthLayout from "../auth-layout";
import { UserAuthForm } from "./components/user-auth-form";

export default function SignIn() {
	return (
		<AuthLayout>
			<Card className="gap-4">
				<CardHeader>
					<CardTitle className="text-lg tracking-tight">Login</CardTitle>
					<CardDescription>
						Sign in with your account to continue to the back office.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<UserAuthForm />
				</CardContent>
				<CardFooter>
					<p className="text-muted-foreground px-8 text-center text-sm">
						By clicking login, you agree to our{" "}
						<a
							href="/terms"
							className="hover:text-primary underline underline-offset-4"
						>
							Terms of Service
						</a>{" "}
						and{" "}
						<a
							href="/privacy"
							className="hover:text-primary underline underline-offset-4"
						>
							Privacy Policy
						</a>
						.
					</p>
				</CardFooter>
			</Card>
		</AuthLayout>
	);
}
