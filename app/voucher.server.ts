/**
 * Generate a unique voucher code
 * Format: SHAREJOY-XXXXXXXXXXXX (12 random alphanumeric chars)
 */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SHAREJOY-';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate voucher code format
 */
export function isValidVoucherCode(code: string): boolean {
  return /^SHAREJOY-[A-Z0-9]{12}$/.test(code);
}
