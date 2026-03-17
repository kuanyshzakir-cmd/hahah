/**
 * Normalize a phone number to +7XXXXXXXXXX format (Kazakhstan).
 * Returns null if the number cannot be normalized.
 */
export function normalizePhone(raw: string): string | null {
  // Remove everything except digits and leading +
  const digits = raw.replace(/[^\d]/g, '')

  if (!digits) return null

  // Kazakhstan numbers: 7XXXXXXXXXX (11 digits) or 8XXXXXXXXXX
  if (digits.length === 11) {
    if (digits.startsWith('7') || digits.startsWith('8')) {
      return `+7${digits.slice(1)}`
    }
  }

  // Already without country code: 10 digits starting with 7XX
  if (digits.length === 10 && digits.startsWith('7')) {
    return `+7${digits}`
  }

  return null
}
