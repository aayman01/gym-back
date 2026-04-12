import { config as loadEnv } from 'dotenv';
import * as path from 'path';
import { envSchema } from './env.schema';

loadEnv({
    path: path.resolve(process.cwd(), `.env`),
});

export default () => {
    const parsed = envSchema.safeParse(process.env);

    console.log('Environment: ', parsed.data?.NODE_ENV);

    if (!parsed.success) {
        console.error('❌ Invalid environment:', parsed.error.format());
        process.exit(1);
    }

    const env = parsed.data;
    return env;
};
