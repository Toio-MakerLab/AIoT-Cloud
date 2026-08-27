import type { Control } from "react-hook-form";
import { SelectDropdown } from "@/components/select-dropdown";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { devicePushChannels } from "../data/data";
import type { DeviceConfigFormValues } from "../data/device-config-form";

interface Props {
	control: Control<DeviceConfigFormValues>;
	pushChannel: DeviceConfigFormValues["pushChannel"];
}

export function DeviceConfigFields({ control, pushChannel }: Props) {
	return (
		<>
			<FormField
				control={control}
				name="isActive"
				render={({ field }) => (
					<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
						<div className="space-y-0.5">
							<FormLabel>Active</FormLabel>
						</div>
						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="apiEndpoint"
				render={({ field }) => (
					<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
						<FormLabel className="col-span-2 text-right">
							API Endpoint
						</FormLabel>
						<FormControl className="col-span-4">
							<Input placeholder="https://api.example.com" {...field} />
						</FormControl>
						<FormMessage className="col-span-4 col-start-3" />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="pushChannel"
				render={({ field }) => (
					<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
						<FormLabel className="col-span-2 text-right">
							Push Channel
						</FormLabel>
						<SelectDropdown
							defaultValue={field.value}
							onValueChange={field.onChange}
							placeholder="Select a channel"
							className="col-span-4"
							items={devicePushChannels.map(({ label, value }) => ({
								label,
								value,
							}))}
						/>
						<FormMessage className="col-span-4 col-start-3" />
					</FormItem>
				)}
			/>

			{pushChannel === "MQTT" ? (
				<>
					<FormField
						control={control}
						name="mqttBroker"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">Broker</FormLabel>
								<FormControl className="col-span-4">
									<Input placeholder="mqtt://broker.example.com" {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="mqttPort"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">Port</FormLabel>
								<FormControl className="col-span-4">
									<Input placeholder="1883" {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="mqttUsername"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">
									Username
								</FormLabel>
								<FormControl className="col-span-4">
									<Input {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="mqttPassword"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">
									Password
								</FormLabel>
								<FormControl className="col-span-4">
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="mqttTelemetryTopic"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">
									Telemetry Topic
								</FormLabel>
								<FormControl className="col-span-4">
									<Input
										placeholder="devices/{deviceId}/telemetry"
										{...field}
									/>
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="mqttCommandTopic"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">
									Command Topic
								</FormLabel>
								<FormControl className="col-span-4">
									<Input placeholder="devices/{deviceId}/command" {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="mqttStatusTopic"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">
									Status Topic
								</FormLabel>
								<FormControl className="col-span-4">
									<Input placeholder="devices/{deviceId}/status" {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
				</>
			) : null}

			{pushChannel === "HTTP" ? (
				<FormField
					control={control}
					name="httpUrl"
					render={({ field }) => (
						<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
							<FormLabel className="col-span-2 text-right">Push URL</FormLabel>
							<FormControl className="col-span-4">
								<Input placeholder="https://example.com/ingest" {...field} />
							</FormControl>
							<FormMessage className="col-span-4 col-start-3" />
						</FormItem>
					)}
				/>
			) : null}

			{pushChannel === "KAFKA" ? (
				<>
					<FormField
						control={control}
						name="kafkaBrokers"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">Brokers</FormLabel>
								<FormControl className="col-span-4">
									<Input placeholder="broker1:9092,broker2:9092" {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="kafkaTopic"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">Topic</FormLabel>
								<FormControl className="col-span-4">
									<Input placeholder="devices.telemetry" {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="kafkaClientId"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">
									Client ID
								</FormLabel>
								<FormControl className="col-span-4">
									<Input {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="kafkaUsername"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">
									Username
								</FormLabel>
								<FormControl className="col-span-4">
									<Input {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="kafkaPassword"
						render={({ field }) => (
							<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
								<FormLabel className="col-span-2 text-right">
									Password
								</FormLabel>
								<FormControl className="col-span-4">
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage className="col-span-4 col-start-3" />
							</FormItem>
						)}
					/>
				</>
			) : null}
		</>
	);
}
