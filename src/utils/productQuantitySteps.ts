export type ProductUnitType = '250g' | '1kg' | 'piece';

export interface ProductQuantityStep {
  index: number;
  value: number; // numeric value in kg (for 250g/1kg) or count (for piece)
  labelBn: string; // e.g. "২৫০ গ্রাম", "৫০০ গ্রাম", "১ কেজি", "১.৫ কেজি"
  labelEn: string; // e.g. "250g", "500g", "1kg", "1.5kg"
  shortLabel: string; // e.g. "250g", "500g", "1kg", "1.5kg", "2kg", "3kg" or "1", "2", "3"
  multiplier: number; // Price multiplier relative to the base unit price
}

/**
 * Bengali digits converter
 */
export function toBnDigit(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, d => bnDigits[parseInt(d, 10)]);
}

/**
 * Resolves the unit type:
 * - '250g': 250g base sequence (250g -> 500g -> 750g -> 1kg -> 1.5kg -> 2kg -> 3kg etc.)
 * - '1kg': 1kg base sequence (1kg -> 1.5kg -> 2kg -> 2.5kg -> 3kg etc.)
 * - 'piece': Piece/Count base sequence (1, 2, 3, 4, 5 etc.)
 */
export function getProductUnitType(product: {
  unit_type?: string;
  unitType?: string;
  unit?: string;
  unit_pack?: string;
}): ProductUnitType {
  const explicit = (product.unit_type || product.unitType || '').toLowerCase().trim();
  if (explicit) {
    if (explicit.includes('250') || explicit.includes('gram') || explicit.includes('gm')) {
      return '250g';
    }
    if (explicit.includes('1kg') || explicit.includes('kg') || explicit.includes('kilo')) {
      return '1kg';
    }
    if (
      explicit.includes('piece') ||
      explicit.includes('count') ||
      explicit.includes('pcs') ||
      explicit.includes('item') ||
      explicit.includes('পিস') ||
      explicit.includes('টি')
    ) {
      return 'piece';
    }
  }

  // Infer from unit / unit_pack string
  const unitText = `${product.unit_pack || ''} ${product.unit || ''}`.toLowerCase();

  // If contains 250 or 250g or powa
  if (
    unitText.includes('250') ||
    unitText.includes('২৫০') ||
    unitText.includes('পোয়া') ||
    unitText.includes('powa')
  ) {
    return '250g';
  }

  // If contains grams and not kg
  if (
    (unitText.includes('গ্রাম') || unitText.includes('gram') || unitText.includes('gm')) &&
    !unitText.includes('কেজি') &&
    !unitText.includes('kg')
  ) {
    return '250g';
  }

  // If contains kg or liter
  if (
    unitText.includes('কেজি') ||
    unitText.includes('kg') ||
    unitText.includes('কিলো') ||
    unitText.includes('লিটার') ||
    unitText.includes('liter') ||
    unitText.includes('litre')
  ) {
    return '1kg';
  }

  // Default to piece / count
  return 'piece';
}

/**
 * Detect the base weight in kg that the product's price corresponds to.
 */
export function getProductBaseWeightInKg(
  product: {
    unit_type?: string;
    unitType?: string;
    unit?: string;
    unit_pack?: string;
  },
  unitType: ProductUnitType
): number {
  const unitText = `${product.unit_pack || ''} ${product.unit || ''}`.toLowerCase();

  if (unitText.includes('250') || unitText.includes('২৫০') || unitText.includes('পোয়া')) {
    return 0.25;
  }
  if (unitText.includes('500') || unitText.includes('৫০০')) {
    return 0.50;
  }
  if (unitText.includes('100') || unitText.includes('১০০')) {
    return 0.10;
  }
  if (unitText.includes('750') || unitText.includes('৭৫০')) {
    return 0.75;
  }
  if (
    unitText.includes('কেজি') ||
    unitText.includes('kg') ||
    unitText.includes('লিটার') ||
    unitText.includes('liter')
  ) {
    return 1.0;
  }

  // Default according to unitType
  if (unitType === '250g') {
    return 0.25;
  }
  return 1.0;
}

/**
 * Generates the array of ProductQuantityStep for a product
 */
export function generateQuantitySteps(product: {
  unit_type?: string;
  unitType?: string;
  unit?: string;
  unit_pack?: string;
  stockQuantity?: number;
  stock_quantity?: number;
  stock?: number;
}): ProductQuantityStep[] {
  const unitType = getProductUnitType(product);
  const baseWeightInKg = getProductBaseWeightInKg(product, unitType);
  const stock = product.stock_quantity ?? product.stockQuantity ?? product.stock ?? 99;

  const steps: ProductQuantityStep[] = [];

  if (unitType === '250g') {
    // 250g base: Increment steps sequence: 250g -> 500g -> 750g -> 1kg -> 1.5kg -> 2kg -> 3kg etc.
    const initialWeights = [0.25, 0.50, 0.75, 1.00, 1.50, 2.00];
    const allWeights = [...initialWeights];

    // Continue: 3kg, 4kg, 5kg, 6kg, 7kg, 8kg, 9kg, 10kg, 12kg, 15kg, 20kg, 25kg, 30kg, 40kg, 50kg
    const extraKg = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50];
    for (const kg of extraKg) {
      allWeights.push(kg);
    }

    allWeights.forEach((w, idx) => {
      let labelEn: string;
      let labelBn: string;
      let shortLabel: string;

      if (w < 1.0) {
        const grams = Math.round(w * 1000);
        labelEn = `${grams}g`;
        labelBn = `${toBnDigit(grams)} গ্রাম`;
        shortLabel = `${grams}g`;
      } else {
        labelEn = `${w}kg`;
        labelBn = `${toBnDigit(w)} কেজি`;
        shortLabel = `${w}kg`;
      }

      const multiplier = Number((w / baseWeightInKg).toFixed(4));

      steps.push({
        index: idx,
        value: w,
        labelBn,
        labelEn,
        shortLabel,
        multiplier
      });
    });
  } else if (unitType === '1kg') {
    // 1kg base: Increment steps sequence: 1kg -> 1.5kg -> 2kg -> 2.5kg -> 3kg etc.
    const weights = [
      1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0,
      5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0,
      12.0, 15.0, 20.0, 25.0, 30.0, 40.0, 50.0
    ];

    const unitStr = `${product.unit_pack || ''} ${product.unit || ''}`.toLowerCase();
    const isLiter = unitStr.includes('লিটার') || unitStr.includes('liter');

    weights.forEach((w, idx) => {
      const unitNameEn = isLiter ? 'L' : 'kg';
      const unitNameBn = isLiter ? 'লিটার' : 'কেজি';

      const labelEn = `${w}${unitNameEn}`;
      const labelBn = `${toBnDigit(w)} ${unitNameBn}`;
      const shortLabel = `${w}${unitNameEn}`;
      const multiplier = Number((w / baseWeightInKg).toFixed(4));

      steps.push({
        index: idx,
        value: w,
        labelBn,
        labelEn,
        shortLabel,
        multiplier
      });
    });
  } else {
    // Piece/Count base: Increment steps sequence: 1, 2, 3, 4, 5 etc.
    const maxCount = Math.max(1, Math.min(stock > 0 ? stock : 50, 100));

    // Common piece counts: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 25, 30, 40, 50...
    const counts: number[] = [];
    for (let c = 1; c <= Math.min(maxCount, 12); c++) {
      counts.push(c);
    }
    const higher = [15, 20, 25, 30, 40, 50, 60, 75, 100];
    for (const h of higher) {
      if (h <= maxCount && !counts.includes(h)) {
        counts.push(h);
      }
    }
    if (counts.length === 0) counts.push(1);

    const unitStr = `${product.unit_pack || ''} ${product.unit || ''}`.toLowerCase();
    const isDozen = unitStr.includes('ডজন');
    const isPacket = unitStr.includes('প্যাকেট');
    const isBox = unitStr.includes('বক্স');

    let suffixBn = 'টি';
    if (isDozen) suffixBn = 'ডজন';
    else if (isPacket) suffixBn = 'প্যাকেট';
    else if (isBox) suffixBn = 'বক্স';

    counts.forEach((c, idx) => {
      const labelEn = `${c} ${c === 1 ? 'pc' : 'pcs'}`;
      const labelBn = `${toBnDigit(c)} ${suffixBn}`;
      const shortLabel = String(c);
      const multiplier = c;

      steps.push({
        index: idx,
        value: c,
        labelBn,
        labelEn,
        shortLabel,
        multiplier
      });
    });
  }

  return steps;
}

/**
 * Calculates dynamic total price for the selected step
 */
export function calculateDynamicStepPrice(unitPrice: number, step: ProductQuantityStep): number {
  if (!unitPrice || unitPrice <= 0 || !step) return 0;
  return Math.round(unitPrice * step.multiplier);
}
