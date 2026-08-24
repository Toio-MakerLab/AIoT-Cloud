import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	secret: string | null;
}

export function DeviceSecretDialog({ open, onOpenChange, secret }: Props) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		if (!secret) return;
		await navigator.clipboard.writeText(secret);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Device Secret</DialogTitle>
					<DialogDescription>
						Copy this secret now and store it on the device firmware. It will
						not be shown again.
					</DialogDescription>
				</DialogHeader>
				<div className="flex gap-2">
					<Input readOnly value={secret ?? ""} className="font-mono text-xs" />
					<Button
						type="button"
						variant="outline"
						onClick={() => void handleCopy()}
					>
						{copied ? (
							<IconCheck className="h-4 w-4" />
						) : (
							<IconCopy className="h-4 w-4" />
						)}
					</Button>
				</div>
				<DialogFooter>
					<Button type="button" onClick={() => onOpenChange(false)}>
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
