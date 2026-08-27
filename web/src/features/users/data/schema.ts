import { z } from 'zod';

// Values match backend `RoleType` enum exactly (src/constants/role-type.ts).
export const userRoleSchema = z.union([z.literal('ROOT'), z.literal('ADMIN'), z.literal('USER'), z.literal('GUEST')]);
export type UserRole = z.infer<typeof userRoleSchema>;

const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  role: userRoleSchema.nullish(),
  isActive: z.boolean().nullish(),
  isEmailVerified: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const userListSchema = z.array(userSchema);
