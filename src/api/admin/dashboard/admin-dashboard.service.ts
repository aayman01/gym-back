import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { DashboardPeriod } from './dto/get-dashboard-query.dto';

const EXCLUDED_ORDER_STATUS = OrderStatus.CANCELLED;

function periodDays(period: DashboardPeriod): number {
  switch (period) {
    case '7d':
      return 7;
    case '90d':
      return 90;
    default:
      return 30;
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(period: DashboardPeriod) {
    const days = periodDays(period);
    const now = new Date();
    const currentEnd = endOfDay(now);
    const currentStart = startOfDay(
      new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000),
    );
    const previousEnd = endOfDay(
      new Date(currentStart.getTime() - 24 * 60 * 60 * 1000),
    );
    const previousStart = startOfDay(
      new Date(previousEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000),
    );

    const orderWhereBase: Prisma.OrderWhereInput = {
      deletedAt: null,
      status: { not: EXCLUDED_ORDER_STATUS },
    };

    const [
      currentRevenueAgg,
      previousRevenueAgg,
      currentOrderCount,
      previousOrderCount,
      totalProducts,
      currentNewProducts,
      previousNewProducts,
      totalCustomers,
      currentNewCustomers,
      previousNewCustomers,
      chartOrders,
      ordersByStatusRaw,
      recentOrderRows,
      inventoryRows,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          ...orderWhereBase,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          ...orderWhereBase,
          createdAt: { gte: previousStart, lte: previousEnd },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: {
          deletedAt: null,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
      }),
      this.prisma.order.count({
        where: {
          deletedAt: null,
          createdAt: { gte: previousStart, lte: previousEnd },
        },
      }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({
        where: {
          deletedAt: null,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
      }),
      this.prisma.product.count({
        where: {
          deletedAt: null,
          createdAt: { gte: previousStart, lte: previousEnd },
        },
      }),
      this.prisma.user.count({
        where: { role: UserRole.CUSTOMER, deletedAt: null },
      }),
      this.prisma.user.count({
        where: {
          role: UserRole.CUSTOMER,
          deletedAt: null,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
      }),
      this.prisma.user.count({
        where: {
          role: UserRole.CUSTOMER,
          deletedAt: null,
          createdAt: { gte: previousStart, lte: previousEnd },
        },
      }),
      this.prisma.order.findMany({
        where: {
          ...orderWhereBase,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
        select: { createdAt: true, totalAmount: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.order.findMany({
        where: { deletedAt: null },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.inventory.findMany({
        include: {
          variant: {
            select: {
              id: true,
              sku: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  lowStockThreshold: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const currentRevenue = Number(currentRevenueAgg._sum.totalAmount ?? 0);
    const previousRevenue = Number(previousRevenueAgg._sum.totalAmount ?? 0);

    const revenueChart = this.buildRevenueChart(
      chartOrders,
      currentStart,
      currentEnd,
    );

    const lowStockAlerts = inventoryRows
      .filter((row) => row.variant.product.deletedAt === null)
      .map((row) => {
        const availableStock = row.quantityOnHand - row.quantityReserved;
        return {
          productId: row.variant.product.id,
          productTitle: row.variant.product.title,
          variantSku: row.variant.sku,
          availableStock,
          lowStockThreshold: row.variant.product.lowStockThreshold,
        };
      })
      .filter((item) => item.availableStock <= item.lowStockThreshold)
      .sort((a, b) => a.availableStock - b.availableStock)
      .slice(0, 10);

    return {
      stats: {
        totalRevenue: currentRevenue.toFixed(2),
        revenueChangePercent: percentChange(currentRevenue, previousRevenue),
        totalOrders: currentOrderCount,
        ordersChangePercent: percentChange(
          currentOrderCount,
          previousOrderCount,
        ),
        totalProducts,
        productsChangePercent: percentChange(
          currentNewProducts,
          previousNewProducts,
        ),
        totalCustomers,
        customersChangePercent: percentChange(
          currentNewCustomers,
          previousNewCustomers,
        ),
      },
      revenueChart,
      ordersByStatus: ordersByStatusRaw.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
      recentOrders: recentOrderRows.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: this.formatCustomerName(order.customer),
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount.toString(),
        createdAt: order.createdAt.toISOString(),
      })),
      lowStockAlerts,
    };
  }

  private buildRevenueChart(
    orders: Array<{ createdAt: Date; totalAmount: Prisma.Decimal }>,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const byDate = new Map<string, { revenue: number; orders: number }>();

    for (
      let d = startOfDay(periodStart);
      d <= periodEnd;
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    ) {
      byDate.set(formatDateKey(d), { revenue: 0, orders: 0 });
    }

    for (const order of orders) {
      const key = formatDateKey(order.createdAt);
      const entry = byDate.get(key);
      if (!entry) continue;
      entry.revenue += Number(order.totalAmount);
      entry.orders += 1;
    }

    return Array.from(byDate.entries()).map(([date, values]) => ({
      date,
      revenue: values.revenue.toFixed(2),
      orders: values.orders,
    }));
  }

  private formatCustomerName(customer: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): string {
    const name = [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return name || customer.email;
  }
}
