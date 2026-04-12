import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'production', 'test', 'provision'])
        .default('development'),
    PORT: z.coerce.number(),
    DATABASE_URL: z.string().url(),
    ALLOWED_ORIGINS: z
        .string()
        .transform((val) => val.split(',')),
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
