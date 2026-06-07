import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const dashboardPeriodSchema = z.enum(['7d', '30d', '90d']);

export const getDashboardQuerySchema = z.object({
  period: dashboardPeriodSchema.default('30d'),
});

export class GetDashboardQueryDto extends createZodDto(getDashboardQuerySchema) {}

export type DashboardPeriod = z.infer<typeof dashboardPeriodSchema>;
