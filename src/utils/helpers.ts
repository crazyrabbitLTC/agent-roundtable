/**
 * Format a timestamp as a human-readable date string
 * @param timestamp - The timestamp to format
 * @returns The formatted date string
 */
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

/**
 * Generate a letter-based identifier (A, B, C, ..., Z, AA, AB, ...)
 * @param index - The index to convert to a letter-based identifier
 * @returns The letter-based identifier
 */
export const indexToLetters = (index: number): string => {
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }
  
  const firstChar = String.fromCharCode(65 + Math.floor(index / 26) - 1);
  const secondChar = String.fromCharCode(65 + (index % 26));
  
  return `${firstChar}${secondChar}`;
};

/**
 * Truncate a string to a maximum length
 * @param str - The string to truncate
 * @param maxLength - The maximum length
 * @returns The truncated string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) {
    return str;
  }
  
  return `${str.substring(0, maxLength - 3)}...`;
};

/**
 * Sleep for a specified number of milliseconds
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}; 