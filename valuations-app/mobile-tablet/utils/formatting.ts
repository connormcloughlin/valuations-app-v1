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