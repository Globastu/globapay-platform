import { InvoiceItem } from '@/lib/contracts/invoices';

export interface TaxRate {
  id: string;
  rate: number; // percentage (e.g., 20 for 20%)
  inclusive: boolean; // true = inclusive, false = exclusive
}

export interface Discount {
  id: string;
  type: 'percentage' | 'amount';
  value: number; // percentage (0-100) or amount in minor units
}

export interface CalculationResult {
  subtotal: number; // sum before discounts and tax
  taxTotal: number;
  discountTotal: number;
  total: number;
  amountDue: number;
}

/**
 * Calculate invoice totals based on items, tax rates, and discounts
 * Rules:
 * 1. Calculate line amount: quantity * unitAmount
 * 2. Apply discount to line before tax (pre-tax discount for MVP)
 * 3. Apply tax:
 *    - Exclusive: add on top (rate%)
 *    - Inclusive: compute tax portion; total price stays same
 */
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  taxRates: TaxRate[] = [],
  discounts: Discount[] = []
): CalculationResult {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  // Create lookup maps
  const taxRateMap = new Map(taxRates.map(tr => [tr.id, tr]));
  const discountMap = new Map(discounts.map(d => [d.id, d]));

  for (const item of items) {
    // Calculate base line amount
    const lineAmount = item.quantity * item.unitAmount;
    subtotal += lineAmount;

    // Apply discount to this line (pre-tax)
    let discountAmount = 0;
    if (item.discountId && discountMap.has(item.discountId)) {
      const discount = discountMap.get(item.discountId)!;
      if (discount.type === 'percentage') {
        discountAmount = Math.floor((lineAmount * discount.value) / 100);
      } else {
        discountAmount = Math.min(discount.value, lineAmount); // cap at line amount
      }
      discountTotal += discountAmount;
    }

    // Calculate taxable amount (after discount)
    const taxableAmount = lineAmount - discountAmount;

    // Apply tax
    if (item.taxRateId && taxRateMap.has(item.taxRateId)) {
      const taxRate = taxRateMap.get(item.taxRateId)!;
      
      if (taxRate.inclusive) {
        // Inclusive tax: compute tax portion from taxable amount
        // If taxable amount is $120 with 20% inclusive tax, tax portion is $20
        const taxPortion = Math.floor((taxableAmount * taxRate.rate) / (100 + taxRate.rate));
        taxTotal += taxPortion;
      } else {
        // Exclusive tax: add tax on top of taxable amount
        const taxAmount = Math.floor((taxableAmount * taxRate.rate) / 100);
        taxTotal += taxAmount;
      }
    }
  }

  const total = subtotal - discountTotal + taxTotal;
  const amountDue = total; // For MVP, amountDue = total (no partial payments)

  return {
    subtotal,
    taxTotal,
    discountTotal,
    total,
    amountDue,
  };
}