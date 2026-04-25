/**
 * Security utilities for input sanitization and validation
 * Provides defense against XSS, injection attacks, and malicious input
 */

// HTML entities for encoding
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Encode HTML entities to prevent XSS attacks
 * @param input - String to encode
 * @returns Encoded string safe for HTML context
 */
export function encodeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize user input by removing dangerous patterns
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, '')
    // Remove data: URLs (potential MIME sniffing)
    .replace(/data\s*:/gi, '')
    // Remove angular expressions
    .replace(/{{\s*[\w.]+\s*}}/g, '')
    // Trim and limit length
    .trim()
    .substring(0, 1000);
}

/**
 * Validate and sanitize URL
 * @param url - URL string to validate
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Only allow safe protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.href;
  } catch {
    // If not a valid URL, check if it's a relative path
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    return '';
  }
}

/**
 * Validate URL against allowlist
 * @param url - URL to validate
 * @param allowedDomains - List of allowed domains
 * @returns true if URL is valid and allowed
 */
export function validateURL(url: string, allowedDomains: string[]): boolean {
  if (!url || !allowedDomains || !Array.isArray(allowedDomains)) {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    
    return allowedDomains.some((domain) => {
      const allowed = new URL(`https://${domain}`);
      return parsed.hostname === allowed.hostname;
    });
  } catch {
    return false;
  }
}

/**
 * Strip all HTML tags from string
 * @param input - String with potential HTML
 * @returns Plain text string
 */
export function stripHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate phone number format (Russian format)
 * @param phone - Phone number string
 * @returns true if valid Russian phone format
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove all non-digits except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Russian mobile: +79xxxxxxxxx or 89xxxxxxxxx
  const phoneRegex = /^(\+7|7|8)?[9]\d{9}$/;
  return phoneRegex.test(cleaned.replace(/\+/g, ''));
}

/**
 * Escape string for use in regex
 * @param input - String to escape
 * @returns Regex-safe string
 */
export function escapeRegex(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove control characters from string
 * @param input - String to clean
 * @returns String without control characters
 */
export function removeControlChars(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove control characters except newline, tab
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}