import { z } from 'zod';

const factorySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullish(),
  description: z.string().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Factory = z.infer<typeof factorySchema>;

export const factoryListSchema = z.array(factorySchema);
