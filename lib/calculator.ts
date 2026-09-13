export interface CostBreakdown {
  homePrice: number;
  landPrice: number;
  sitePrep: number;
  waterService: number;
  sewerService: number;
  electrical: number;
  delivery: number;
  permits: number;
  contingency: number;
  upgrades: number; // extensions & add-ons
}

export interface MortgageInputs {
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number;
}

export interface MortgageResult {
  /** Amount financed, INCLUDING the CMHC premium (when one applies). */
  principal: number;
  /** The down payment actually used — raised to the legal minimum if the requested one was too low. */
  downPayment: number;
  monthlyPayment: number;
  biweeklyPayment: number;
  totalInterest: number;
  totalPaid: number;
  totalProjectCost: number;
  /** Amount financed BEFORE the CMHC premium is added. */
  loanBeforeInsurance: number;
  /** CMHC premium rate applied (0 when the mortgage isn't insured). */
  cmhcPremiumRate: number;
  /** Dollar amount of the CMHC premium (0 when the mortgage isn't insured). */
  cmhcPremium: number;
  /** The legally required minimum down payment for this price. */
  minimumDownPayment: number;
  /** True when the requested down payment was below the minimum and was raised to meet it. */
  downPaymentRaisedToMinimum: boolean;
  /** downPayment expressed as a percentage of totalCost. */
  effectiveDownPaymentPercent: number;
}

export function calculateTotalCost(costs: CostBreakdown): number {
  return Object.values(costs).reduce((sum, val) => sum + val, 0);
}

/**
 * Canadian minimum down payment rules: 5% of the first $500,000, plus 10% of
 * the portion between $500,000 and $1,500,000. At $1,500,000 or more, the
 * minimum is 20% (and the mortgage cannot be insured — see cmhcPremiumRate).
 */
function minimumDownPaymentFor(price: number): number {
  if (price >= 1_500_000) return price * 0.2;
  const firstTier = Math.min(price, 500_000) * 0.05;
  const secondTier = Math.max(0, price - 500_000) * 0.1;
  return firstTier + secondTier;
}

/**
 * CMHC mortgage default insurance premium rate, keyed by loan-to-value band.
 * Callers must only invoke this when insurance actually applies (LTV > 80%
 * and price under the $1.5M insurable ceiling).
 */
function cmhcPremiumRateFor(loanToValuePercent: number, amortizationYears: number): number {
  let rate: number;
  if (loanToValuePercent > 90) rate = 0.04;
  else if (loanToValuePercent > 85) rate = 0.031;
  else rate = 0.028; // 80.01–85%

  // Amortization beyond 25 years on an insured mortgage adds a 0.20% surcharge.
  if (amortizationYears > 25) rate += 0.002;
  return rate;
}

export function calculateMortgage(
  totalCost: number,
  inputs: MortgageInputs
): MortgageResult {
  const requestedDownPayment = totalCost * (inputs.downPaymentPercent / 100);
  const minimumDownPayment = minimumDownPaymentFor(totalCost);

  const downPaymentRaisedToMinimum = requestedDownPayment < minimumDownPayment;
  const downPayment = downPaymentRaisedToMinimum ? minimumDownPayment : requestedDownPayment;

  const loanBeforeInsurance = totalCost - downPayment;
  const effectiveDownPaymentPercent = totalCost > 0 ? (downPayment / totalCost) * 100 : 0;
  const loanToValuePercent = totalCost > 0 ? (loanBeforeInsurance / totalCost) * 100 : 0;

  // Insured mortgages aren't available at/above the $1.5M price ceiling.
  let cmhcPremiumRate = 0;
  let cmhcPremium = 0;
  if (totalCost < 1_500_000 && loanToValuePercent > 80) {
    cmhcPremiumRate = cmhcPremiumRateFor(loanToValuePercent, inputs.amortizationYears);
    cmhcPremium = loanBeforeInsurance * cmhcPremiumRate;
  }

  const principal = loanBeforeInsurance + cmhcPremium;

  // Semi-annual compounding — the Canadian standard for posted mortgage
  // rates. The effective monthly rate is derived from the semi-annual rate
  // rather than simply dividing the annual rate by 12.
  const semiAnnualRate = inputs.interestRate / 100 / 2;
  const monthlyRate = Math.pow(1 + semiAnnualRate, 1 / 6) - 1;
  const numPayments = inputs.amortizationYears * 12;

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = principal / numPayments;
  } else {
    monthlyPayment =
      (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
  }

  const totalPaid = monthlyPayment * numPayments;
  const totalInterest = totalPaid - principal;
  const biweeklyPayment = (monthlyPayment * 12) / 26;

  return {
    principal,
    downPayment,
    monthlyPayment,
    biweeklyPayment,
    totalInterest,
    totalPaid,
    totalProjectCost: totalCost,
    loanBeforeInsurance,
    cmhcPremiumRate,
    cmhcPremium,
    minimumDownPayment,
    downPaymentRaisedToMinimum,
    effectiveDownPaymentPercent,
  };
}

/** Monthly payment only — used to show a "+$/mo" delta for a given total cost. */
export function monthlyPaymentFor(totalCost: number, inputs: MortgageInputs): number {
  return calculateMortgage(totalCost, inputs).monthlyPayment;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
