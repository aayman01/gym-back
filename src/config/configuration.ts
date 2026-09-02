import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import * as path from 'path';
import { envSchema } from './env.schema';

const envPath = path.resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  loadEnv({ path: envPath });
}

export default () => {
  const parsed = envSchema.safeParse(process.env);

  console.log('Environment: ', parsed.data?.NODE_ENV);

  if (!parsed.success) {
    console.error('❌ Invalid environment:', parsed.error.format());
    throw new Error(
      `Invalid environment variables: ${JSON.stringify(parsed.error.format())}`,
    );
  }

  return parsed.data;
};
