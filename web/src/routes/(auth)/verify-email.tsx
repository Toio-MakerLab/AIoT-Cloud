import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import VerifyEmail from '@/features/auth/verify-email';

const searchSchema = z.object({
  email: z.string().optional(),
  token: z.string().optional(),
});

export const Route = createFileRoute('/(auth)/verify-email')({
  validateSearch: searchSchema,
  component: VerifyEmail,
});
