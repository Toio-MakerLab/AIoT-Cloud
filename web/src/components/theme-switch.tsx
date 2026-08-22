import { IconCheck, IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Theme, useTheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";

export function ThemeSwitch() {
	const { theme, setTheme } = useTheme();

	/* Update theme-color meta tag
	 * when theme is updated */
	useEffect(() => {
		const themeColor = theme === Theme.Dark ? "#020817" : "#fff";
		const metaThemeColor = document.querySelector("meta[name='theme-color']");
		if (metaThemeColor) metaThemeColor.setAttribute("content", themeColor);
	}, [theme]);

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="scale-95 rounded-full">
					<IconSun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<IconMoon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme(Theme.Light)}>
					Light{" "}
					<IconCheck
						size={14}
						className={cn("ml-auto", theme !== Theme.Light && "hidden")}
					/>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme(Theme.Dark)}>
					Dark
					<IconCheck
						size={14}
						className={cn("ml-auto", theme !== Theme.Dark && "hidden")}
					/>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme(Theme.System)}>
					System
					<IconCheck
						size={14}
						className={cn("ml-auto", theme !== Theme.System && "hidden")}
					/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
