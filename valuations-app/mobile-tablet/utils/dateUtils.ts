/**
 * Date utility functions for handling UTC dates from the backend
 * and displaying them correctly for South African users (UTC+2)
 */

// South Africa Standard Time is UTC+2 year-round (no daylight saving)
const SA_TIMEZONE_OFFSET_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

/**
 * Get the current date/time in South Africa timezone
 * @returns Date object representing current time in SA timezone
 */
export const getTodayInSA = (): Date => {
  const now = new Date();
  // Get UTC time and add SA offset to get SA local time
  const saTime = new Date(now.getTime() + SA_TIMEZONE_OFFSET_MS);
  return saTime;
};

/**
 * Get the start of day (00:00:00) in South Africa timezone for a given date
 * @param date - Optional date to use, defaults to today
 * @returns Date object representing start of day in SA timezone, converted to UTC
 */
export const getStartOfDayInSA = (date?: Date): Date => {
  const now = date || new Date();
  
  // Get date components in SA timezone using Intl formatter
  const saFormatter = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = saFormatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10) - 1; // Month is 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
  
  // Create date at 00:00:00 SA time, then convert to UTC
  // We create it as if it were UTC, then adjust
  const saMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  // Subtract SA offset (2 hours) to get UTC equivalent
  return new Date(saMidnight.getTime() - SA_TIMEZONE_OFFSET_MS);
};

/**
 * Get the end of day (23:59:59.999) in South Africa timezone for a given date
 * @param date - Optional date to use, defaults to today
 * @returns Date object representing end of day in SA timezone, converted to UTC
 */
export const getEndOfDayInSA = (date?: Date): Date => {
  const now = date || new Date();
  
  // Get date components in SA timezone using Intl formatter
  const saFormatter = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = saFormatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10) - 1; // Month is 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
  
  // Create date at 23:59:59.999 SA time, then convert to UTC
  const saEndOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  // Subtract SA offset (2 hours) to get UTC equivalent
  return new Date(saEndOfDay.getTime() - SA_TIMEZONE_OFFSET_MS);
};

/**
 * Safely parse a UTC date string
 * @param dateString - ISO date string from backend (should be UTC)
 * @returns Date object, or null if parsing fails
 */
export const parseUTCDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    // If the string doesn't end with 'Z', assume it's UTC and add 'Z'
    const utcString = dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)
      ? dateString
      : `${dateString}Z`;
    
    const date = new Date(utcString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn('Error parsing date string:', dateString, error);
    return null;
  }
};

/**
 * Format a UTC date string for display in South Africa timezone
 * @param dateString - ISO date string from backend (UTC)
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string for SA locale, or 'Unknown' if invalid
 */
export const formatDateForSA = (
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = parseUTCDate(dateString);
  if (!date) return 'Unknown';
  
  // Default options for date formatting
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Johannesburg', // SA timezone
  };
  
  try {
    return new Intl.DateTimeFormat('en-ZA', { ...defaultOptions, ...options }).format(date);
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return 'Invalid date';
  }
};

/**
 * Format a UTC time string for display in South Africa timezone
 * @param dateString - ISO date string from backend (UTC)
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted time string for SA locale, or 'Time TBD' if invalid
 */
export const formatTimeForSA = (
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = parseUTCDate(dateString);
  if (!date) return 'Time TBD';
  
  // Default options for time formatting
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Johannesburg', // SA timezone
  };
  
  try {
    return new Intl.DateTimeFormat('en-ZA', { ...defaultOptions, ...options }).format(date);
  } catch (error) {
    console.warn('Error formatting time:', dateString, error);
    return 'Time TBD';
  }
};

/**
 * Format both date and time from a UTC date string
 * @param dateString - ISO date string from backend (UTC)
 * @returns Object with formatted date and time strings
 */
export const formatDateTimeForSA = (dateString: string | null | undefined): {
  date: string;
  time: string;
} => {
  return {
    date: formatDateForSA(dateString),
    time: formatTimeForSA(dateString),
  };
};

/**
 * Get ISO string for start of today in SA timezone (for API calls)
 * @returns ISO string in UTC representing start of today in SA
 */
export const getStartOfTodayISO = (): string => {
  return getStartOfDayInSA().toISOString();
};

/**
 * Get ISO string for end of today in SA timezone (for API calls)
 * @returns ISO string in UTC representing end of today in SA
 */
export const getEndOfTodayISO = (): string => {
  return getEndOfDayInSA().toISOString();
};

