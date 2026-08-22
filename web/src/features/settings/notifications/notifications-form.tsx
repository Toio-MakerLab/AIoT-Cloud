// biome-ignore assist/source/organizeImports: <explanation>
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
	Check,
	Copy,
	ExternalLink,
	Loader2,
	RefreshCw,
	Unlink,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { getResponseMessage } from "@/lib/response-codes";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getChannelDeepLinkRedirectUrl } from "./api/notifications-settings-api";
import {
	useChannelDeepLinkQuery,
	useNotificationSettingQuery,
	useRequestChannelVerificationMutation,
	useUnlinkChannelMutation,
	useUpdateNotificationSettingMutation,
} from "./api/queries";
import {
	NOTIFICATION_CHANNELS,
	VERIFIABLE_NOTIFICATION_CHANNELS,
	type INotificationChannel,
	type NotificationChannelType,
} from "./api/types";

function buildChannelState(
	existing: INotificationChannel[] | undefined,
): Record<NotificationChannelType, INotificationChannel> {
	const state = {} as Record<NotificationChannelType, INotificationChannel>;
	for (const { value } of NOTIFICATION_CHANNELS) {
		const found = existing?.find((c) => c.channel === value);
		state[value] = found ?? { channel: value, enabled: false, token: "" };
	}
	return state;
}

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 10;

function useCopyToClipboard() {
	const [copied, setCopied] = useState(false);

	const copy = async (text: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return { copied, copy };
}

function UnlinkChannelButton({
	channel,
}: {
	channel: NotificationChannelType;
}) {
	const [open, setOpen] = useState(false);
	const unlinkChannel = useUnlinkChannelMutation();

	const handleUnlink = async () => {
		try {
			await unlinkChannel.mutateAsync(channel);
			toast.success("Channel unlinked");
			setOpen(false);
		} catch (error) {
			toast.error(getResponseMessage(error));
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => setOpen(true)}
			>
				<Unlink className="size-4" />
				Unlink
			</Button>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Unlink this channel?</AlertDialogTitle>
					<AlertDialogDescription>
						You'll stop receiving notifications here until you link it again.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex gap-2">
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleUnlink}
						disabled={unlinkChannel.isPending}
					>
						{unlinkChannel.isPending && (
							<Loader2 className="size-4 animate-spin" />
						)}
						Unlink
					</AlertDialogAction>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function ZaloVerificationPanel({
	channel,
	onCheckStatus,
}: {
	channel: INotificationChannel;
	/** Refetches the setting and reports whether this channel is now linked. */
	onCheckStatus: () => Promise<boolean>;
}) {
	const requestVerification = useRequestChannelVerificationMutation();
	const { copied, copy } = useCopyToClipboard();

	const verification = requestVerification.data?.data;
	const deepLinkQuery = useChannelDeepLinkQuery(
		channel.channel,
		!!verification && !channel.enabled,
	);
	const deepLink = deepLinkQuery.data?.deepLink;

	const [pollAttempts, setPollAttempts] = useState(0);
	const pollExhausted = pollAttempts >= MAX_POLL_ATTEMPTS;

	// Keep the latest onCheckStatus without making it an effect dependency, so unrelated
	// re-renders of the parent form (e.g. editing another channel's token) don't reset the
	// interval below.
	const onCheckStatusRef = useRef(onCheckStatus);
	useEffect(() => {
		onCheckStatusRef.current = onCheckStatus;
	}, [onCheckStatus]);

	const handleRequest = () => {
		setPollAttempts(0);
		requestVerification.mutate(
			{ channel: channel.channel },
			{
				onError: (error) => {
					toast.error(getResponseMessage(error));
				},
			},
		);
	};

	// Auto-poll for the linked status once a code is issued. Stops as soon as it's linked
	// (channel.enabled flips to true) or after MAX_POLL_ATTEMPTS unsuccessful checks — the
	// user can still tap "Check now" or "Request new code" to keep going manually.
	useEffect(() => {
		if (!verification || channel.enabled || pollExhausted) return;
		const id = setInterval(async () => {
			const linked = await onCheckStatusRef.current();
			if (!linked) setPollAttempts((n) => n + 1);
		}, POLL_INTERVAL_MS);
		return () => clearInterval(id);
	}, [verification, channel.enabled, pollExhausted]);

	if (channel.enabled) {
		return (
			<div className="flex items-center gap-2">
				<Badge variant="success">Linked</Badge>
				<UnlinkChannelButton channel={channel.channel} />
			</div>
		);
	}

	if (!verification) {
		return (
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={handleRequest}
				disabled={requestVerification.isPending}
			>
				{requestVerification.isPending && (
					<Loader2 className="size-4 animate-spin" />
				)}
				Link with Zalo
			</Button>
		);
	}

	return (
		<div className="w-full space-y-3 rounded-lg border p-4">
			<p className="text-sm">{verification.message}</p>
			<div className="flex items-center gap-2">
				<code className="bg-muted flex-1 rounded px-3 py-2 font-mono text-sm">
					{verification.code}
				</code>
				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={() => copy(verification.code)}
				>
					{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
				</Button>
			</div>
			<p className="text-muted-foreground text-xs">
				Expires at {new Date(verification.expiresAt).toLocaleTimeString()}
			</p>
			{deepLink && (
				<div className="flex flex-col items-center gap-2 border-t pt-3 sm:flex-row sm:justify-between">
					<div className="rounded-md border bg-white p-2">
						<QRCodeSVG value={deepLink} size={128} />
					</div>
					<div className="text-center sm:text-left">
						<p className="text-muted-foreground text-xs">
							Scan with your phone's Zalo app, or on mobile:
						</p>
						<Button type="button" variant="link" size="sm" asChild>
							<a href={getChannelDeepLinkRedirectUrl(channel.channel)}>
								Open Zalo
								<ExternalLink className="size-3.5" />
							</a>
						</Button>
					</div>
				</div>
			)}
			<div className="flex items-center gap-2">
				<Button
					type="button"
					size="sm"
					onClick={() => onCheckStatusRef.current()}
					disabled={pollExhausted}
				>
					<RefreshCw className="size-4" />
					I've sent it — check status
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleRequest}
					disabled={requestVerification.isPending}
				>
					Request new code
				</Button>
			</div>
			{!pollExhausted ? (
				<p className="text-muted-foreground text-xs">
					Checking automatically… (attempt {pollAttempts}/{MAX_POLL_ATTEMPTS})
				</p>
			) : (
				<p className="text-destructive text-xs">
					Stopped after {MAX_POLL_ATTEMPTS} tries — tap "Check status" or
					"Request new code" to keep going.
				</p>
			)}
		</div>
	);
}

export function NotificationsForm() {
	const { data, isLoading, refetch } = useNotificationSettingQuery();
	const updateSetting = useUpdateNotificationSettingMutation();
	const [channels, setChannels] = useState<
		Record<NotificationChannelType, INotificationChannel>
	>(() => buildChannelState(undefined));

	useEffect(() => {
		if (data) {
			setChannels(buildChannelState(data.channels));
		}
	}, [data]);

	const updateChannel = (
		channel: NotificationChannelType,
		patch: Partial<INotificationChannel>,
	) => {
		setChannels((prev) => ({
			...prev,
			[channel]: { ...prev[channel], ...patch },
		}));
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			await updateSetting.mutateAsync({
				channels: Object.values(channels),
			});
			toast.success("Notification settings updated");
		} catch (error) {
			toast.error(getResponseMessage(error));
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				{NOTIFICATION_CHANNELS.map(({ value }) => (
					<Skeleton key={value} className="h-20 w-full" />
				))}
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-4">
				{NOTIFICATION_CHANNELS.map(({ value, label, description }) => {
					const isVerifiable = VERIFIABLE_NOTIFICATION_CHANNELS.includes(value);
					const channel = channels[value];

					return (
						<div
							key={value}
							className="flex flex-col gap-3 rounded-lg border p-4"
						>
							<div className="flex flex-row items-center justify-between">
								<div className="space-y-0.5">
									<Label className="text-base">{label}</Label>
									<p className="text-muted-foreground text-sm">{description}</p>
								</div>
								{isVerifiable ? (
									<ZaloVerificationPanel
										channel={channel}
										onCheckStatus={async () => {
											const result = await refetch();
											const updated = result.data?.channels.find(
												(c) => c.channel === value,
											);
											return !!updated?.enabled;
										}}
									/>
								) : (
									<Switch
										checked={channel.enabled}
										onCheckedChange={(enabled) =>
											updateChannel(value, { enabled })
										}
									/>
								)}
							</div>
							{!isVerifiable && channel.enabled && (
								<Input
									placeholder={`${label} address / token`}
									value={channel.token}
									onChange={(e) =>
										updateChannel(value, { token: e.target.value })
									}
								/>
							)}
						</div>
					);
				})}
			</div>
			<Separator />
			<Button type="submit" disabled={updateSetting.isPending}>
				{updateSetting.isPending && <Loader2 className="size-4 animate-spin" />}
				Update notifications
			</Button>
		</form>
	);
}
