/**
 * Currency formatter utility for wallet and transaction displays
 */

/**
 * Format a number as currency/credits
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  options?: {
    showSymbol?: boolean;
    symbol?: string;
    decimals?: number;
    locale?: string;
  }
): string {

  const {
    showSymbol = true,
    symbol = '₹',
    decimals = 2,
    locale = 'en-IN',
  } = options || {};

  const formattedNumber = amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `${symbol}${formattedNumber}` : formattedNumber;
}

/**
 * Format credits (alias for formatCurrency without symbol)
 * @param credits - The credit amount to format
 * @returns Formatted credits string
 */
export function formatCredits(credits: number): string {
  return formatCurrency(credits, { showSymbol: true });
}

/**
 * Format amount with sign prefix (+ or -)
 * @param amount - The amount to format
 * @param type - Transaction type ('credit' or 'debit')
 * @returns Formatted amount with sign
 */
export function formatAmountWithSign(
  amount: number,
  type: 'credit' | 'debit'
): string {
  const sign = type === 'credit' ? '+' : '-';
  return `${sign}${formatCredits(amount)}`;
}
