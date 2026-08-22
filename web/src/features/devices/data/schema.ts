import { z } from "zod";

export const deviceStatusSchema = z.union([
	z.literal("ONLINE"),
	z.literal("OFFLINE"),
]);
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;

export const deviceTemplateTypeSchema = z.union([
	z.literal("SENSOR_NODE"),
	z.literal("RELAY_NODE"),
	z.literal("GATEWAY"),
	z.literal("OTHER"),
]);
export type DeviceTemplateType = z.infer<typeof deviceTemplateTypeSchema>;

const deviceTemplateSummarySchema = z.object({
	id: z.string(),
	name: z.string(),
	type: deviceTemplateTypeSchema,
	icon: z.string().nullish(),
});
export type DeviceTemplateSummary = z.infer<typeof deviceTemplateSummarySchema>;

const deviceSchema = z.object({
	id: z.string(),
	deviceId: z.string(),
	name: z.string(),
	templateId: z.string(),
	template: deviceTemplateSummarySchema.optional(),
	userId: z.string(),
	lastSeenAt: z.coerce.date().nullish(),
	status: deviceStatusSchema,
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
export type Device = z.infer<typeof deviceSchema>;

export const deviceListSchema = z.array(deviceSchema);
