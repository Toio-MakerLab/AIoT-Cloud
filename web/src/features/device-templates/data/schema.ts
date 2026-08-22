import { z } from "zod";

// Values match backend `DeviceTemplateType` enum exactly
// (src/constants/device-template-type.ts).
export const deviceTemplateTypeSchema = z.union([
	z.literal("SENSOR_NODE"),
	z.literal("RELAY_NODE"),
	z.literal("GATEWAY"),
	z.literal("OTHER"),
]);
export type DeviceTemplateType = z.infer<typeof deviceTemplateTypeSchema>;

export const telemetryFieldSchema = z.object({
	key: z.string().min(1),
	label: z.string().min(1),
	unit: z.string().optional(),
});
export type TelemetryField = z.infer<typeof telemetryFieldSchema>;

const deviceTemplateSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: deviceTemplateTypeSchema,
	description: z.string().nullish(),
	manufacturer: z.string().nullish(),
	telemetrySchema: z.array(telemetryFieldSchema).nullish(),
	icon: z.string().nullish(),
	isActive: z.boolean(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
export type DeviceTemplate = z.infer<typeof deviceTemplateSchema>;

export const deviceTemplateListSchema = z.array(deviceTemplateSchema);
