import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {format, parseISO} from "date-fns"
import {uk} from "date-fns/locale"
import type {Money} from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Numeric major-unit value of a Money (0 when absent/unparseable). */
export function moneyAmount(m: Money | null | undefined): number {
  if (!m || typeof m.amount !== "string") return 0;
  const n = Number(m.amount);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Build a Money from a numeric major-unit value, fixed to 2 decimals.
 * Used for optimistic/derived totals computed client-side.
 */
export function toMoney(amount: number, currency: string): Money {
  return { amount: (Number.isFinite(amount) ? amount : 0).toFixed(2), currency };
}

/**
 * Sum line items (price × quantity) into a single Money.
 * Currency is taken from the first item; empty list → 0.00 in `fallbackCurrency`.
 */
export function sumMoney(
  items: ReadonlyArray<{ price: Money; quantity: number }>,
  fallbackCurrency = "UAH",
): Money {
  const currency = items[0]?.price?.currency ?? fallbackCurrency;
  const total = items.reduce((sum, it) => sum + moneyAmount(it.price) * it.quantity, 0);
  return toMoney(total, currency);
}

/**
 * Render a line total (unit price × quantity) as a localized currency string.
 * Display-only: arithmetic is done over Number(amount), keeping the currency.
 */
export function formatLineTotal(price: Money | null | undefined, quantity: number): string {
  if (!price) return "";
  return formatMoney(toMoney(moneyAmount(price) * quantity, price.currency));
}

/**
 * Format a {@link Money} wire value (major-unit decimal string + ISO-4217 code)
 * into a localized currency string using the browser/Node Intl APIs.
 *
 * @example formatMoney({ amount: "300.00", currency: "UAH" }) // "300,00 ₴"
 * @param m - Money object, or null/undefined (call-sites may pass an absent value)
 * @returns localized currency string, or '' when the input is missing/unparseable
 */
export function formatMoney(m: Money | null | undefined): string {
  if (!m || typeof m.amount !== "string" || typeof m.currency !== "string") {
    return "";
  }
  const numeric = Number(m.amount);
  if (m.amount.trim() === "" || !Number.isFinite(numeric)) {
    return "";
  }
  try {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: m.currency,
    }).format(numeric);
  } catch {
    // Unknown/invalid ISO currency code → fall back to plain amount + code.
    return `${numeric} ${m.currency}`;
  }
}

/**
* Format number or string to currency format
* @param value - The amount to format (string or number)
* @param currency - Currency code, defaults to ₴ (Ukrainian hryvnia)
* @returns Formatted currency string
*/
export function formatCurrency(value: string | number, currency: string = '₴'): string {
 // Convert to number if it's a string
 const numValue = typeof value === 'string' ? parseFloat(value) : value;
 
 // Handle NaN or invalid values
 if (isNaN(numValue)) {
   return `0 ${currency}`;
 }
 
 // Format with thousand separators
 const formatted = numValue.toLocaleString('uk-UA');
 
 return `${formatted} ${currency}`;
}

/**
* Formats a BigDecimal string to CO2 reduction format
* @param value BigDecimal string value in kg
* @param precision Decimal places to show, defaults to 2
* @returns Formatted CO2 reduction string
*/
export function formatCO2Reduction(value: string | null | undefined, precision = 2): string {
 if (!value) return '0 kg';
 
 // Handle any potential string formatting issues
 const numValue = parseFloat(value);
 if (isNaN(numValue)) return '0 kg';
 
 return numValue.toLocaleString('ru-RU', {
   minimumFractionDigits: precision,
   maximumFractionDigits: precision
 }) + ' kg';
}

/**
* Adds two BigDecimal strings safely
* @param a First BigDecimal string
* @param b Second BigDecimal string
* @returns Sum as string with proper precision
*/
export function addBigDecimal(a: string, b: string): string {
 const numA = parseFloat(a || '0');
 const numB = parseFloat(b || '0');
 
 if (isNaN(numA) || isNaN(numB)) {
   return '0.00';
 }
 
 // Use toFixed(2) to maintain 2 decimal places
 return (numA + numB).toFixed(2);
}

/**
* Multiplies a BigDecimal string by a number safely
* @param a BigDecimal string
* @param b Multiplier (number)
* @returns Product as string with proper precision
*/
export function multiplyBigDecimal(a: string, b: number): string {
 const numA = parseFloat(a || '0');
 
 if (isNaN(numA) || isNaN(b)) {
   return '0.00';
 }
 
 // Use toFixed(2) to maintain 2 decimal places
 return (numA * b).toFixed(2);
}

// Formats currency in hryvnias (UAH)
export function formatUAHCurrency(amount: number): string {
  return new Intl.NumberFormat('ua-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Formats a date
export function formatDate(date: string | Date, includeTime: boolean = false): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  
  // Detect locale from the document language or use Ukrainian as fallback
  const currentLocale = typeof document !== 'undefined' 
    ? document.documentElement.lang
    : 'uk';
    
  // Use UK locale for Ukrainian language, default locale otherwise
  const dateLocale = currentLocale === 'uk' ? uk : undefined;
  
  const formatString = includeTime 
    ? "d MMMM yyyy, HH:mm" 
    : "d MMMM yyyy";
    
  return format(dateObj, formatString, { locale: dateLocale });
}
