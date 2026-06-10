export interface Installment {
  number: number;
  dueDate: string;
  principal: number;
  interest: number;
  tax: number;
  total: number;
  isPaid: boolean;
}

export interface LoanMetadata {
  isLoan: boolean;
  loanAmount: number;
  interestRate: number;
  term: number;
  kkdf: number;
  bsmv: number;
  installments: Installment[];
}

const LOAN_MARKER = '===LOAN_DATA===';

/**
 * Calculates a standard loan amortization schedule with KKDF & BSMV taxes.
 */
export function calculateAmortizationSchedule(
  principal: number,
  term: number,
  monthlyRatePercent: number,
  kkdfPercent: number,
  bsmvPercent: number,
  firstDueDateStr: string
): Installment[] {
  const installments: Installment[] = [];
  let remainingPrincipal = principal;

  const r = monthlyRatePercent / 100;
  const taxRate = (kkdfPercent + bsmvPercent) / 100;
  const rTaxed = r * (1 + taxRate);

  // Calculate monthly installment amount
  let installment = 0;
  if (rTaxed === 0 || term <= 0) {
    installment = principal / (term || 1);
  } else {
    installment = (principal * rTaxed * Math.pow(1 + rTaxed, term)) / (Math.pow(1 + rTaxed, term) - 1);
  }

  // Round installment to 2 decimals
  installment = Math.round(installment * 100) / 100;

  const baseDate = new Date(firstDueDateStr);

  for (let k = 1; k <= term; k++) {
    // Calculate date for this installment
    const dueDate = new Date(baseDate.getTime());
    dueDate.setMonth(baseDate.getMonth() + k - 1);
    const dateStr = dueDate.toISOString().split('T')[0];

    let interest = remainingPrincipal * r;
    let tax = interest * taxRate;
    let principalPaid = installment - interest - tax;

    // Adjust for the last month to prevent rounding leftover pennies
    if (k === term || remainingPrincipal - principalPaid < 0.05) {
      principalPaid = remainingPrincipal;
      interest = remainingPrincipal * r;
      tax = interest * taxRate;
      remainingPrincipal = 0;
    } else {
      remainingPrincipal -= principalPaid;
    }

    // Rounding components
    const pRounded = Math.round(principalPaid * 100) / 100;
    const iRounded = Math.round(interest * 100) / 100;
    const tRounded = Math.round(tax * 100) / 100;
    const totalRounded = Math.round((pRounded + iRounded + tRounded) * 100) / 100;

    installments.push({
      number: k,
      dueDate: dateStr,
      principal: pRounded,
      interest: iRounded,
      tax: tRounded,
      total: totalRounded,
      isPaid: false
    });
  }

  return installments;
}

/**
 * Parses loan metadata from the description string.
 */
export function parseLoanMetadata(description?: string): LoanMetadata | null {
  if (!description || !description.includes(LOAN_MARKER)) {
    return null;
  }

  try {
    const parts = description.split(LOAN_MARKER);
    const jsonStr = parts[1].trim();
    return JSON.parse(jsonStr) as LoanMetadata;
  } catch (err) {
    console.error('Error parsing loan metadata:', err);
    return null;
  }
}

/**
 * Serializes loan metadata and appends it to the base description.
 */
export function serializeLoanMetadata(baseDescription: string, metadata: LoanMetadata): string {
  const cleanBase = extractBaseDescription(baseDescription);
  return `${cleanBase}\n\n${LOAN_MARKER}\n${JSON.stringify(metadata)}`;
}

/**
 * Extracts the base description without the loan metadata block.
 */
export function extractBaseDescription(description?: string): string {
  if (!description) return '';
  if (!description.includes(LOAN_MARKER)) return description.trim();

  const parts = description.split(LOAN_MARKER);
  return parts[0].trim();
}
