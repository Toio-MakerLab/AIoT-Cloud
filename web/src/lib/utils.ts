import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
	return format(new Date(date), "MMM d, yyyy, h:mm a");
}

export async function hashPassword(password: string) {
	return crypto.subtle
		.digest("SHA-256", new TextEncoder().encode(password))
		.then((buffer) => {
			const hashArray = Array.from(new Uint8Array(buffer));
			const hashHex = hashArray
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			return hashHex;
		});
}
