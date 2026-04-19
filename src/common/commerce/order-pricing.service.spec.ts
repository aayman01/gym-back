import { Test } from '@nestjs/testing';
import { Prisma, ProductType, TaxType } from '@prisma/client';
import {
  DELIVERY_QUANTITY_THRESHOLD,
  OrderPricingService,
} from './order-pricing.service';

describe('OrderPricingService', () => {
  let service: OrderPricingService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [OrderPricingService],
    }).compile();
    service = moduleRef.get(OrderPricingService);
  });

  it('applies base shipping when total quantity is at threshold', () => {
    const base = new Prisma.Decimal(10);
    expect(
      service.computeShippingAmount(base, DELIVERY_QUANTITY_THRESHOLD),
    ).toEqual(base);
  });

  it('doubles shipping when total quantity exceeds threshold', () => {
    const base = new Prisma.Decimal(10);
    const doubled = service.computeShippingAmount(
      base,
      DELIVERY_QUANTITY_THRESHOLD + 1,
    );
    expect(doubled.toString()).toBe('20');
  });

  it('computes percentage tax on exclusive price when tax not included', () => {
    const lines = [
      {
        quantity: 2,
        unitPriceGross: new Prisma.Decimal(50),
        productType: ProductType.PHYSICAL,
        isTaxIncluded: false,
        productTax: {
          id: 't1',
          rate: new Prisma.Decimal(10),
          type: TaxType.PERCENTAGE,
          isActive: true,
        },
      },
    ];
    const totals = service.computeOrderTotals(lines, {
      defaultTax: null,
      shippingMethodBasePrice: null,
      skipShipping: true,
    });
    expect(totals.itemTotal.toString()).toBe('100');
    expect(totals.taxAmount.toString()).toBe('10');
    expect(totals.shippingAmount.toString()).toBe('0');
    expect(totals.totalAmount.toString()).toBe('110');
  });

  it('aggregates itemTotal, taxAmount, shippingAmount, totalAmount for mixed cart', () => {
    const lines = [
      {
        quantity: 2,
        unitPriceGross: new Prisma.Decimal(10),
        productType: ProductType.PHYSICAL,
        isTaxIncluded: false,
        productTax: null,
      },
    ];
    const totals = service.computeOrderTotals(lines, {
      defaultTax: null,
      shippingMethodBasePrice: new Prisma.Decimal(5),
      skipShipping: false,
    });
    expect(totals.itemTotal.toString()).toBe('20');
    expect(totals.taxAmount.toString()).toBe('0');
    expect(totals.shippingAmount.toString()).toBe('5');
    expect(totals.totalAmount.toString()).toBe('25');
  });
});
