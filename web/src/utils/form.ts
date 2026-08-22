import type { FieldErrors, FieldValues } from "react-hook-form";
import { toast } from "sonner";

export function onFormInvalid<T extends FieldValues>(errors: FieldErrors<T>) {
	const messages = Object.entries(errors)
		.map(
			([field, err]) =>
				`${field}: ${(err as { message?: string })?.message ?? "invalid"}`,
		)
		.join("\n");
	toast.error("Please fix the following errors", { description: messages });
}
