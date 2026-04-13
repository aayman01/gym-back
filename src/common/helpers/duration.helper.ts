/**
 * Parse duration strings like 15m, 7d into milliseconds (ezybizz parity).
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhdwy]?)$/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2] || 's';

  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  };

  return value * (units[unit] || 1000);
}
