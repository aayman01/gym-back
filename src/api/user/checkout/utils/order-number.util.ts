import { randomBytes } from 'node:crypto';

/** Unique order number, max 20 chars per DB constraint. */
export function generateOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = randomBytes(3).toString('hex').toUpperCase();
  return `GYM${t}${r}`.slice(0, 20);
}
