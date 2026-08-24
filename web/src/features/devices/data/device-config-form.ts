import { z } from "zod";
import type { IUpdateDeviceConfig } from "../api/types";
import type { DeviceNetworkConfig, DevicePushChannel } from "./schema";

export const deviceConfigFormSchema = z.object({
	apiEndpoint: z.string().optional(),
	pushChannel: z.union([
		z.literal("MQTT"),
		z.literal("HTTP"),
		z.literal("KAFKA"),
	]),
	mqttBroker: z.string().optional(),
	mqttPort: z.string().optional(),
	mqttUsername: z.string().optional(),
	mqttPassword: z.string().optional(),
	mqttTelemetryTopic: z.string().optional(),
	mqttCommandTopic: z.string().optional(),
	mqttStatusTopic: z.string().optional(),
	httpUrl: z.string().optional(),
	kafkaBrokers: z.string().optional(),
	kafkaTopic: z.string().optional(),
	kafkaClientId: z.string().optional(),
});
export type DeviceConfigFormValues = z.infer<typeof deviceConfigFormSchema>;

export function deviceConfigFormDefaults(
	config: DeviceNetworkConfig | null | undefined,
	pushChannel: DevicePushChannel,
): DeviceConfigFormValues {
	return {
		apiEndpoint: config?.apiEndpoint ?? "",
		pushChannel,
		mqttBroker: config?.mqtt?.broker ?? "",
		mqttPort: config?.mqtt?.port ? String(config.mqtt.port) : "",
		mqttUsername: config?.mqtt?.username ?? "",
		mqttPassword: config?.mqtt?.password ?? "",
		mqttTelemetryTopic: config?.mqtt?.topics?.telemetry ?? "",
		mqttCommandTopic: config?.mqtt?.topics?.command ?? "",
		mqttStatusTopic: config?.mqtt?.topics?.status ?? "",
		httpUrl: config?.http?.url ?? "",
		kafkaBrokers: config?.kafka?.brokers ?? "",
		kafkaTopic: config?.kafka?.topic ?? "",
		kafkaClientId: config?.kafka?.clientId ?? "",
	};
}

export function deviceConfigFormToPayload(
	values: DeviceConfigFormValues,
): IUpdateDeviceConfig {
	return {
		apiEndpoint: values.apiEndpoint || undefined,
		pushChannel: values.pushChannel,
		mqtt:
			values.pushChannel === "MQTT"
				? {
						broker: values.mqttBroker ?? "",
						port: Number(values.mqttPort) || 1883,
						username: values.mqttUsername || undefined,
						password: values.mqttPassword || undefined,
						topics: {
							telemetry: values.mqttTelemetryTopic ?? "",
							command: values.mqttCommandTopic || undefined,
							status: values.mqttStatusTopic || undefined,
						},
					}
				: undefined,
		http:
			values.pushChannel === "HTTP" ? { url: values.httpUrl ?? "" } : undefined,
		kafka:
			values.pushChannel === "KAFKA"
				? {
						brokers: values.kafkaBrokers ?? "",
						topic: values.kafkaTopic ?? "",
						clientId: values.kafkaClientId || undefined,
					}
				: undefined,
	};
}
