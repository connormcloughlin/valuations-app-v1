/**
 * Formatting utility functions for the app
 */
import { formatDateForSA, parseUTCDate } from './dateUtils';

/**
 * Format a number as currency (ZAR)
 * @param value - The number to format
 * @returns Formatted currency string
 */
export const currencyFormat = (value: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format a date to a readable string
 * Handles both Date objects and UTC date strings from the backend
 * @param date - Date to format (Date object or UTC ISO string)
 * @returns Formatted date string
 */
export const dateFormat = (date: Date | string): string => {
  // If it's a string, parse it as UTC and format for SA
  if (typeof date === 'string') {
    return formatDateForSA(date);
  }
  
  // If it's a Date object, format it with SA timezone
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Johannesburg',
  }).format(date);
};

/**
 * Truncate text with ellipsis if it exceeds the maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/** Parse YYMM (e.g. 2603) to a Date at the first of that month. */
function dateFromYYMM(period: string): Date | null {
  if (!/^\d{4}$/.test(period)) return null;
  const yy = Number(period.slice(0, 2));
  const mm = Number(period.slice(2, 4));
  if (mm < 1 || mm > 12) return null;
  return new Date(2000 + yy, mm - 1, 1);
}

/** Human-readable payroll period, e.g. "March 2026". */
export function formatPeriodYYMM(period: string): string {
  const date = dateFromYYMM(period);
  if (!date) return period;
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  }).format(date);
}

/** Short payroll period label, e.g. "Mar 2026". */
export function formatPeriodShortYYMM(period: string): string {
  const date = dateFromYYMM(period);
  if (!date) return period;
  return new Intl.DateTimeFormat('en-ZA', {
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  }).format(date);
}

export function assessmentCountLabel(count: number): string {
  return count === 1 ? '1 assessment' : `${count} assessments`;
} 