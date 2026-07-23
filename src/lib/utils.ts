import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Standard clsx + tailwind-merge helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price dynamically using active currency and exchange rate from localStorage
export const formatPrice = (
  price: number | string | null | undefined,
  customCurrency?: string,
  customRate?: number
): string => {
  if (price === null || price === undefined) return 'GH₵ 0.00';
  const val = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(val)) return 'GH₵ 0.00';
  
  let currency = customCurrency || 'GHS';
  let rate = customRate || 1.0;

  if (!customCurrency) {
    try {
      currency = localStorage.getItem('sevee_currency') || 'GHS';
      const storedRate = localStorage.getItem('sevee_rate');
      rate = storedRate ? parseFloat(storedRate) : 1.0;
    } catch (e) {
      // Fallback
    }
  }

  const converted = val / rate;
  let symbol = 'GH₵';
  let locale = 'en-GH';

  if (currency === 'USD') {
    symbol = '$';
    locale = 'en-US';
  } else if (currency === 'EUR') {
    symbol = '€';
    locale = 'de-DE';
  } else if (currency === 'GBP') {
    symbol = '£';
    locale = 'en-GB';
  }

  return `${symbol} ${converted.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Resolve relative image paths (e.g. /uploads/foo.webp) to full backend URLs
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
export const resolveImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

// Format date helper
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
