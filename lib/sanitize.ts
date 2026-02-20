/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes dangerous HTML tags and JavaScript
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Remove script tags specifically (double check)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '')
  
  return sanitized.trim()
}

/**
 * Sanitize number input - only allow numbers, decimals, and negative sign
 */
export function sanitizeNumber(input: string): string {
  if (!input) return ''
  return input.replace(/[^\d.-]/g, '')
}

/**
 * Sanitize symbol/ticker - only allow alphanumeric and common trading symbols
 */
export function sanitizeSymbol(input: string): string {
  if (!input) return ''
  // Allow letters, numbers, and common separators like / - _
  return input.replace(/[^a-zA-Z0-9/\-_]/g, '').toUpperCase()
}

/**
 * Sanitize notes/text fields - allow basic text but remove dangerous content
 */
export function sanitizeText(input: string): string {
  if (!input) return ''
  
  let sanitized = input
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  
  // Remove object/embed tags
  sanitized = sanitized.replace(/<(object|embed)[^>]*>/gi, '')
  
  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/data:text\/html/gi, '')
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  return sanitized.trim()
}

/**
 * Validate and sanitize date input
 */
export function sanitizeDate(input: string): string {
  if (!input) return ''
  
  // For YYYY-MM-DD format
  const dateMatch = input.match(/^\d{4}-\d{2}-\d{2}$/)
  if (dateMatch) return input
  
  // For single/double digit day numbers
  const dayMatch = input.match(/^\d{1,2}$/)
  if (dayMatch) return input
  
  // Invalid format - return empty
  return ''
}

/**
 * Escape HTML entities to prevent XSS in displayed content
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Validate email format (basic check)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''
  
  const trimmed = url.trim()
  
  // Block dangerous protocols
  if (
    trimmed.toLowerCase().startsWith('javascript:') ||
    trimmed.toLowerCase().startsWith('data:') ||
    trimmed.toLowerCase().startsWith('vbscript:')
  ) {
    return ''
  }
  
  return trimmed
}

/**
 * Rate limiting helper - tracks action frequency
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs)
    
    if (validAttempts.length >= this.maxAttempts) {
      return false
    }
    
    validAttempts.push(now)
    this.attempts.set(key, validAttempts)
    return true
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}
