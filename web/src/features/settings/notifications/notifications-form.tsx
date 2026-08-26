import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { getResponseMessage } from "@/lib/response-codes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	useNotificationConfigsQuery,
	useUpsertNotificationConfigMutation,
	useZaloLinkCodeMutation,
} from "./api/queries";
import { NOTIFICATION_CHANNELS, type INotificationConfig } from "./api/types";

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 15;

function useCopyToClipboard() {
	const [copied, setCopied] = useState(false);

	const copy = async (text: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return { copied, copy };
}

/**
 * Zalo Bot API has no OAuth/deep-link start-payload, so linking is a pairing code the user
 * pastes as a plain message to the bot. Once the webhook records the chat id, `isLinked` flips
 * to true on the config — this panel polls for that instead of requiring a manual refresh.
 */
/** Rendered only while a channel isn't linked yet — full-width block below the channel header. */
function ZaloLinkPanel() {
	const requestLinkCode = useZaloLinkCodeMutation();
	const { copied, copy } = useCopyToClipboard();
	const [pollAttempts, setPollAttempts] = useState(0);

	const link = requestLinkCode.data?.data;
	const pollExhausted = pollAttempts >= MAX_POLL_ATTEMPTS;

	const configsQuery = useNotificationConfigsQuery({
		refetchInterval: link && !pollExhausted ? POLL_INTERVAL_MS : false,
	});

	useEffect(() => {
		if (!link || pollExhausted) {
			return;
		}

		const timer = setTimeout(() => setPollAttempts((n) => n + 1), POLL_INTERVAL_MS);

		return () => clearTimeout(timer);
	}, [link, pollExhausted, pollAttempts]);

	const handleRequest = async () => {
		setPollAttempts(0);

		try {
			await requestLinkCode.mutateAsync();
		} catch (error) {
			toast.error(getResponseMessage(error));
		}
	};

	if (!link) {
		return (
			<Button
				type="button"
				size="sm"
				onClick={handleRequest}
				disabled={requestLinkCode.isPending}
			>
				{requestLinkCode.isPending && (
					<Loader2 className="size-4 animate-spin" />
				)}
				Link Zalo
			</Button>
		);
	}

	return (
		<div className="w-full min-w-0 space-y-3 rounded-md border p-4">
			<p className="text-sm text-muted-foreground">
				Open the bot below and send it this code as a message:
			</p>
			<div className="flex flex-col items-start gap-4 sm:flex-row">
				{link.shareUrl && (
					<div className="shrink-0 self-center rounded-md border p-2 sm:self-start">
						<QRCodeSVG value={link.shareUrl} size={112} />
					</div>
				)}
				<div className="w-full min-w-0 space-y-2">
					<div className="flex w-full min-w-0 items-start gap-2">
						<code className="min-w-0 flex-1 break-all rounded bg-muted px-3 py-2 text-sm">
							{link.code}
						</code>
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="shrink-0"
							title="Copy code"
							aria-label="Copy code"
							onClick={() => copy(link.code)}
						>
							{copied ? (
								<Check className="size-4" />
							) : (
								<Copy className="size-4" />
							)}
						</Button>
					</div>
					{link.shareUrl && (
						<a
							className="inline-flex items-center gap-1 text-sm text-primary underline"
							href={link.shareUrl}
							target="_blank"
							rel="noreferrer"
						>
							Open Zalo bot
							<ExternalLink className="size-3.5" />
						</a>
					)}
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 pt-1">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => configsQuery.refetch()}
					disabled={pollExhausted}
				>
					<RefreshCw className="size-4" />
					Check status
				</Button>
				<span className="text-xs text-muted-foreground">
					{pollExhausted
						? "Stopped checking automatically — refresh to try again."
						: `Checking automatically... (${pollAttempts}/${MAX_POLL_ATTEMPTS})`}
				</span>
			</div>
		</div>
	);
}

function ChannelRow({ config }: { config: INotificationConfig }) {
	const meta = NOTIFICATION_CHANNELS.find((c) => c.value === config.channel);
	const upsertConfig = useUpsertNotificationConfigMutation();
	const [messageTemplate, setMessageTemplate] = useState(
		config.messageTemplate ?? "",
	);

	const handleToggle = async (enabled: boolean) => {
		try {
			await upsertConfig.mutateAsync({
				channel: config.channel,
				data: { isEnabled: enabled },
			});
		} catch (error) {
			toast.error(getResponseMessage(error));
		}
	};

	const handleSaveTemplate = async () => {
		try {
			await upsertConfig.mutateAsync({
				channel: config.channel,
				data: { messageTemplate: messageTemplate || null },
			});
			toast.success("Message template saved");
		} catch (error) {
			toast.error(getResponseMessage(error));
		}
	};

	return (
		<div className="space-y-4 rounded-lg border p-4">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 space-y-0.5">
					<div className="flex flex-wrap items-center gap-2">
						<Label>{meta?.label ?? config.channel}</Label>
						<Badge variant={config.isLinked ? "success" : "outline"}>
							{config.isLinked ? "Linked" : "Not linked"}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">{meta?.description}</p>
				</div>
				<Switch
					checked={config.isEnabled}
					disabled={!config.isLinked || upsertConfig.isPending}
					onCheckedChange={handleToggle}
				/>
			</div>
			{!config.isLinked && <ZaloLinkPanel />}
			{config.isLinked && (
				<>
					<Separator />
					<div className="space-y-2">
						<Label htmlFor={`template-${config.channel}`}>
							Message template
						</Label>
						<Textarea
							id={`template-${config.channel}`}
							placeholder="Device {{deviceName}} — {{field}} is {{value}} (expected {{min}}-{{max}})"
							value={messageTemplate}
							onChange={(e) => setMessageTemplate(e.target.value)}
						/>
						<Button
							type="button"
							size="sm"
							onClick={handleSaveTemplate}
							disabled={upsertConfig.isPending}
						>
							{upsertConfig.isPending && (
								<Loader2 className="size-4 animate-spin" />
							)}
							Save template
						</Button>
					</div>
				</>
			)}
		</div>
	);
}

export function NotificationsForm() {
	const { data, isLoading } = useNotificationConfigsQuery();
	const configs = data?.data ?? [];

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
		<div className="space-y-4">
			{NOTIFICATION_CHANNELS.map(({ value }) => {
				const config = configs.find((c) => c.channel === value) ?? {
					id: value,
					channel: value,
					isEnabled: false,
					messageTemplate: null,
					isLinked: false,
					createdAt: "",
					updatedAt: "",
				};

				return <ChannelRow key={value} config={config} />;
			})}
		</div>
	);
}
