import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";

export function ProfileDropdown() {
	const navigate = useNavigate();
	// const { signOut, isAuthenticated } = useLogto()
	const { user, reset, isAuthenticated } = useAuthStore((state) => state.auth);

	const handleLogout = async () => {
		// Sign out from Logto if authenticated via Logto
		if (isAuthenticated()) {
			// const postLogoutRedirectUri = import.meta.env.VITE_LOGTO_POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000'
			// await signOut(postLogoutRedirectUri)
			// reset()
			// call via API to invalidate the refresh token
		}

		// Clear local auth state
		reset();
		toast.success("Logged out successfully");
		navigate({ to: "/sign-in" });
	};

	// Get user display name and initials using LogtoService
	// const displayName = LogtoService.getUserDisplayName(user)
	const displayName = user?.fullName || "User";
	// const initials = LogtoService.getUserInitials(user)

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-8 w-8 rounded-full">
					<Avatar className="h-8 w-8">
						<AvatarImage
							src={user?.picture || "/avatars/01.png"}
							alt={displayName}
						/>
						<AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm leading-none font-medium">{displayName}</p>
						<p className="text-muted-foreground text-xs leading-none">
							{user?.email || "No email"}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link to="/settings">
							Profile
							<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link to="/settings">
							Billing
							<DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link to="/settings">
							Settings
							<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem>New Team</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleLogout}>
					Log out
					<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
