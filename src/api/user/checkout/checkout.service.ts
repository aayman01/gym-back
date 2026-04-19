import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementDirection,
  InventoryTransactionType,
  ItemStatus,
  OrderEventActionBy,
  OrderEventType,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProductType,
  Tax,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderPricingService } from '@common/commerce/order-pricing.service';
import type { CheckoutLineInput } from '@common/commerce/order-pricing.service';
import { generateOrderNumber } from './utils/order-number.util';
import { PlaceOrderDto } from './dto/place-order.dto';
import { PreviewCheckoutDto } from './dto/preview-checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderPricing: OrderPricingService,
  ) {}

  async getPaymentMethods() {
    return this.prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, code: true, name: true, imageUrl: true },
    });
  }

  async getShippingMethods() {
    return this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        deliveryDays: true,
      },
    });
  }

  async previewCheckout(customerId: string, dto: PreviewCheckoutDto) {
    const { lines, defaultTax } = await this.loadSelectedCartLines(customerId);
    if (lines.length === 0) {
      throw new BadRequestException('Cart has no selected items');
    }

    const needsShipping = lines.some(
      (l) => l.product.type === ProductType.PHYSICAL,
    );
    let shippingMethodBase: Prisma.Decimal | null = null;
    if (needsShipping) {
      if (!dto.shippingMethodId) {
        throw new BadRequestException(
          'shippingMethodId is required when the cart contains physical items',
        );
      }
      const method = await this.prisma.shippingMethod.findFirst({
        where: { id: dto.shippingMethodId, isActive: true },
      });
      if (!method) {
        throw new NotFoundException('Shipping method not found');
      }
      shippingMethodBase = method.price;
    }

    const inputs = this.toCheckoutInputs(lines);
    const totals = this.orderPricing.computeOrderTotals(inputs, {
      defaultTax,
      shippingMethodBasePrice: shippingMethodBase,
      skipShipping: !needsShipping,
    });

    return this.formatTotalsResponse(totals);
  }

  async placeOrder(customerId: string, dto: PlaceOrderDto) {
    const { lines, defaultTax, currency } =
      await this.loadSelectedCartLines(customerId);
    if (lines.length === 0) {
      throw new BadRequestException('Cart has no selected items');
    }

    const needsShipping = lines.some(
      (l) => l.product.type === ProductType.PHYSICAL,
    );

    if (needsShipping) {
      if (!dto.shippingMethodId || !dto.shippingAddress) {
        throw new BadRequestException(
          'shippingMethodId and shippingAddress are required for orders with physical items',
        );
      }
    }

    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id: dto.paymentMethodId, isActive: true },
    });
    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    let shippingMethod: { id: string; price: Prisma.Decimal } | null = null;
    if (needsShipping) {
      const method = await this.prisma.shippingMethod.findFirst({
        where: { id: dto.shippingMethodId!, isActive: true },
      });
      if (!method) {
        throw new NotFoundException('Shipping method not found');
      }
      shippingMethod = method;
    }

    const inputs = this.toCheckoutInputs(lines);
    const totals = this.orderPricing.computeOrderTotals(inputs, {
      defaultTax,
      shippingMethodBasePrice: shippingMethod?.price ?? null,
      skipShipping: !needsShipping,
    });

    const billing = dto.billingAddress;
    const shippingPayload =
      needsShipping && dto.shippingAddress
        ? dto.shippingAddress
        : {
            recipientName: billing.recipientName,
            phone: billing.phone,
            addressLine1: billing.addressLine1,
            addressLine2: billing.addressLine2 ?? null,
            city: billing.city,
            stateOrDivision: billing.stateOrDivision,
            postalCode: billing.postalCode ?? null,
            country: billing.country,
          };

    const order = await this.prisma.$transaction(async (tx) => {
      for (const row of lines) {
        await this.assertStock(tx, row);
      }

      const orderNumber = await this.uniqueOrderNumber(tx);

      const createdItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      for (const row of lines) {
        const variant = row.variant!;
        const product = row.product;
        const input: CheckoutLineInput = {
          quantity: row.quantity,
          unitPriceGross: variant.price,
          productType: product.type,
          productTax: product.tax,
          isTaxIncluded: product.isTaxIncluded,
        };
        const { lineExclusive } = this.orderPricing.computeLineExclusiveAndTax(
          input,
          defaultTax,
        );
        const unitExclusive = lineExclusive.div(row.quantity);
        createdItems.push({
          product: { connect: { id: product.id } },
          variant: { connect: { id: variant.id } },
          snapshottedTitle: product.title,
          snapshottedSku: variant.sku,
          snapshottedUnit: String(product.sellingUnit),
          price: unitExclusive,
          quantity: row.quantity,
          lineTotal: lineExclusive,
        });
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          currency,
          totalAmount: totals.totalAmount,
          taxAmount: totals.taxAmount,
          shippingAmount: totals.shippingAmount,
          discountAmount: new Prisma.Decimal(0),
          paymentMethodId: paymentMethod.id,
          items: { create: createdItems },
          billingInfo: {
            create: {
              recipientName: billing.recipientName,
              email: billing.email,
              phone: billing.phone,
              addressLine1: billing.addressLine1,
              addressLine2: billing.addressLine2 ?? null,
              city: billing.city,
              stateOrDivision: billing.stateOrDivision,
              postalCode: billing.postalCode ?? null,
              country: billing.country,
            },
          },
          shippingInfo: {
            create: {
              recipientName: shippingPayload.recipientName,
              phone: shippingPayload.phone,
              addressLine1: shippingPayload.addressLine1,
              addressLine2: shippingPayload.addressLine2 ?? null,
              city: shippingPayload.city,
              stateOrDivision: shippingPayload.stateOrDivision,
              postalCode: shippingPayload.postalCode ?? null,
              country: shippingPayload.country,
              shippingMethodId: shippingMethod?.id ?? null,
            },
          },
          events: {
            create: {
              eventType: OrderEventType.ORDER_PLACED,
              actionBy: OrderEventActionBy.CUSTOMER,
              metadata: dto.notes
                ? ({ notes: dto.notes } as Prisma.JsonObject)
                : Prisma.JsonNull,
            },
          },
        },
        include: {
          items: true,
          billingInfo: true,
          shippingInfo: true,
          paymentMethod: {
            select: { id: true, code: true, name: true },
          },
        },
      });

      const cart = await tx.cart.findFirst({
        where: { customerId },
        select: { id: true },
      });
      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id, isSelected: true },
        });
      }

      for (const row of lines) {
        await this.deductStock(tx, row);
      }

      return newOrder;
    });

    return {
      order: this.mapOrderResponse(
        order,
        totals.itemTotal,
        totals.taxAmount,
        totals.shippingAmount,
        totals.totalAmount,
      ),
    };
  }

  private async uniqueOrderNumber(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const candidate = generateOrderNumber();
      const exists = await tx.order.findUnique({
        where: { orderNumber: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    throw new BadRequestException('Could not allocate order number');
  }

  private formatTotalsResponse(totals: {
    itemTotal: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    shippingAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
  }) {
    return {
      itemTotal: totals.itemTotal.toString(),
      taxAmount: totals.taxAmount.toString(),
      shippingAmount: totals.shippingAmount.toString(),
      totalAmount: totals.totalAmount.toString(),
    };
  }

  private mapOrderResponse(
    order: {
      id: string;
      orderNumber: string;
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      currency: string;
      createdAt: Date;
      items: Array<{
        id: string;
        snapshottedTitle: string;
        snapshottedSku: string;
        quantity: number;
        price: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }>;
      billingInfo: {
        recipientName: string;
        email: string;
        phone: string;
        addressLine1: string;
        city: string;
        stateOrDivision: string;
        country: string;
      } | null;
      shippingInfo: {
        recipientName: string;
        addressLine1: string;
        city: string;
        stateOrDivision: string;
        country: string;
      } | null;
      paymentMethod: { id: string; code: string; name: string } | null;
    },
    itemTotal: Prisma.Decimal,
    taxAmount: Prisma.Decimal,
    shippingAmount: Prisma.Decimal,
    totalAmount: Prisma.Decimal,
  ) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      createdAt: order.createdAt,
      itemTotal: itemTotal.toString(),
      taxAmount: taxAmount.toString(),
      shippingAmount: shippingAmount.toString(),
      totalAmount: totalAmount.toString(),
      items: order.items.map((i) => ({
        id: i.id,
        title: i.snapshottedTitle,
        sku: i.snapshottedSku,
        quantity: i.quantity,
        unitPrice: i.price.toString(),
        lineTotal: i.lineTotal.toString(),
      })),
      billing: order.billingInfo,
      shipping: order.shippingInfo,
      paymentMethod: order.paymentMethod,
    };
  }

  private toCheckoutInputs(
    lines: Array<{
      quantity: number;
      product: {
        type: ProductType;
        tax: Tax | null;
        isTaxIncluded: boolean;
      };
      variant: { price: Prisma.Decimal };
    }>,
  ): CheckoutLineInput[] {
    return lines.map((row) => ({
      quantity: row.quantity,
      unitPriceGross: row.variant.price,
      productType: row.product.type,
      productTax: row.product.tax,
      isTaxIncluded: row.product.isTaxIncluded,
    }));
  }

  private async loadSelectedCartLines(customerId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { customerId },
      include: {
        items: {
          where: { isSelected: true },
          include: {
            product: {
              include: {
                tax: true,
              },
            },
            variant: {
              include: { inventory: true },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new BadRequestException('Cart not found for customer');
    }

    const lines = cart.items.filter(
      (i): i is typeof i & { variant: NonNullable<typeof i.variant> } =>
        i.product.status === ItemStatus.ACTIVE &&
        i.product.deletedAt === null &&
        i.variant !== null &&
        i.variant.status === ItemStatus.ACTIVE,
    );

    const store = await this.prisma.storeConfig.findFirst({
      where: { deletedAt: null },
      select: { currency: true },
    });
    const currency = store?.currency ?? 'USD';

    const defaultTax = await this.prisma.tax.findFirst({
      where: { deletedAt: null, isDefault: true, isActive: true },
    });

    return { lines, defaultTax, currency };
  }

  private async assertStock(
    tx: Prisma.TransactionClient,
    row: {
      quantity: number;
      variant: {
        id: string;
        quantity: number;
        inventory: { quantityOnHand: number; quantityReserved: number } | null;
      };
    },
  ) {
    const available = this.availableStock(row.variant);
    if (row.quantity > available) {
      throw new BadRequestException(
        `Insufficient stock for a line item. Available: ${available}`,
      );
    }
  }

  private availableStock(variant: {
    quantity: number;
    inventory: { quantityOnHand: number; quantityReserved: number } | null;
  }): number {
    if (!variant.inventory) {
      return Math.max(0, variant.quantity);
    }
    return Math.max(
      0,
      variant.inventory.quantityOnHand - variant.inventory.quantityReserved,
    );
  }

  private async deductStock(
    tx: Prisma.TransactionClient,
    row: {
      quantity: number;
      variant: {
        id: string;
        inventory: { quantityOnHand: number } | null;
        quantity: number;
      };
    },
  ) {
    const variantId = row.variant.id;
    const qty = row.quantity;

    if (row.variant.inventory) {
      const inv = await tx.inventory.findUnique({
        where: { variantId },
      });
      if (!inv) return;
      const newOnHand = inv.quantityOnHand - qty;
      await tx.inventory.update({
        where: { variantId },
        data: { quantityOnHand: { decrement: qty } },
      });
      await tx.inventoryTransaction.create({
        data: {
          variantId,
          movementDirection: InventoryMovementDirection.OUT,
          type: InventoryTransactionType.SALE,
          quantityChange: -qty,
          resultingQuantity: newOnHand,
        },
      });
    } else {
      await tx.productVariant.update({
        where: { id: variantId },
        data: { quantity: { decrement: qty } },
      });
    }
  }
}
