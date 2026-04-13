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
}

export interface MortgageInputs {
  downPaymentPercent: number;
  interestRate: number;
  amortizationYears: number;
}

export interface MortgageResult {
  principal: number;
  downPayment: number;
  monthlyPayment: number;
  biweeklyPayment: number;
  totalInterest: number;
  totalPaid: number;
  totalProjectCost: number;
}

export function calculateTotalCost(costs: CostBreakdown): number {
  return Object.values(costs).reduce((sum, val) => sum + val, 0);
}

export function calculateMortgage(
  totalCost: number,
  inputs: MortgageInputs
): MortgageResult {
  const downPayment = totalCost * (inputs.downPaymentPercent / 100);
  const principal = totalCost - downPayment;
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = inputs.amortizationYears * 12;

  let monthlyPayment: number;

  if (monthlyRate === 0) {
    monthlyPayment = principal / numPayments;
  } else {
    monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
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
  };
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
