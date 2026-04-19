import { Injectable } from '@nestjs/common';
import { Prisma, ProductType, Tax, TaxType } from '@prisma/client';

/** Quantity threshold: above this, base delivery charge is multiplied. */
export const DELIVERY_QUANTITY_THRESHOLD = 4;
export const DELIVERY_SURCHARGE_MULTIPLIER = 2;

export type TaxLike = Pick<Tax, 'id' | 'rate' | 'type' | 'isActive'>;

export type CheckoutLineInput = {
  quantity: number;
  unitPriceGross: Prisma.Decimal;
  productType: ProductType;
  productTax: TaxLike | null;
  isTaxIncluded: boolean;
};

export type ComputedOrderTotals = {
  /** Sum of merchandise line amounts excluding tax (exclusive subtotal). */
  itemTotal: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  shippingAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
};

@Injectable()
export class OrderPricingService {
  /**
   * Single delivery charge per order: base × multiplier when total item qty > threshold.
   */
  computeShippingAmount(
    baseMethodPrice: Prisma.Decimal,
    totalItemQuantity: number,
  ): Prisma.Decimal {
    const base = new Prisma.Decimal(baseMethodPrice);
    if (totalItemQuantity <= 0) {
      return new Prisma.Decimal(0);
    }
    const mult =
      totalItemQuantity > DELIVERY_QUANTITY_THRESHOLD
        ? DELIVERY_SURCHARGE_MULTIPLIER
        : 1;
    return base.mul(mult);
  }

  /**
   * Per-line exclusive merchandise and tax; sums to itemTotal and taxAmount.
   */
  computeLineExclusiveAndTax(
    line: CheckoutLineInput,
    fallbackTax: TaxLike | null,
  ): { lineExclusive: Prisma.Decimal; lineTax: Prisma.Decimal } {
    const qty = line.quantity;
    if (qty <= 0) {
      return {
        lineExclusive: new Prisma.Decimal(0),
        lineTax: new Prisma.Decimal(0),
      };
    }

    const tax = line.productTax ?? fallbackTax;
    const gross = new Prisma.Decimal(line.unitPriceGross).mul(qty);

    if (!tax || tax.isActive === false) {
      return {
        lineExclusive: gross,
        lineTax: new Prisma.Decimal(0),
      };
    }

    if (tax.type === TaxType.PERCENTAGE) {
      const ratePct = new Prisma.Decimal(tax.rate);
      if (line.isTaxIncluded) {
        const divisor = new Prisma.Decimal(1).add(ratePct.div(100));
        const exclusive = gross.div(divisor);
        const lineTax = gross.sub(exclusive);
        return { lineExclusive: exclusive, lineTax };
      }
      const exclusive = gross;
      const lineTax = exclusive.mul(ratePct.div(100));
      return { lineExclusive: exclusive, lineTax };
    }

    // FIXED: tax.rate treated as fixed currency per unit per line
    const fixedPerUnit = new Prisma.Decimal(tax.rate);
    const lineTax = fixedPerUnit.mul(qty);
    if (line.isTaxIncluded) {
      const exclusive = gross.sub(lineTax);
      return { lineExclusive: exclusive, lineTax };
    }
    return { lineExclusive: gross, lineTax };
  }

  /**
   * Aggregates cart lines; only PHYSICAL items contribute to paid shipping when a method price is provided.
   */
  computeOrderTotals(
    lines: CheckoutLineInput[],
    options: {
      defaultTax: TaxLike | null;
      shippingMethodBasePrice: Prisma.Decimal | null;
      /** If true, shipping is not charged (all digital / no method). */
      skipShipping: boolean;
    },
  ): ComputedOrderTotals {
    let itemTotal = new Prisma.Decimal(0);
    let taxAmount = new Prisma.Decimal(0);

    for (const line of lines) {
      const { lineExclusive, lineTax } = this.computeLineExclusiveAndTax(
        line,
        options.defaultTax,
      );
      itemTotal = itemTotal.add(lineExclusive);
      taxAmount = taxAmount.add(lineTax);
    }

    const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
    let shippingAmount = new Prisma.Decimal(0);
    if (!options.skipShipping && options.shippingMethodBasePrice !== null) {
      shippingAmount = this.computeShippingAmount(
        options.shippingMethodBasePrice,
        totalQty,
      );
    }

    const totalAmount = itemTotal.add(taxAmount).add(shippingAmount);

    return {
      itemTotal,
      taxAmount,
      shippingAmount,
      totalAmount,
    };
  }
}
