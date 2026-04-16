import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'provision'])
    .default('development'),
  PORT: z.coerce.number(),
  DATABASE_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',')),
  ADMIN_JWT_ACCESS_SECRET: z.string().min(16),
  ADMIN_JWT_REFRESH_SECRET: z.string().min(16),
  ADMIN_JWT_ACCESS_EXPIRES: z.string().default('15m'),
  ADMIN_JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('gym-backend/admin-media'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (result.success === false) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
