export function sanitizeText(value: string, maxLen = 500): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function validateRequired(value: string, label: string): string | null {
  if (!sanitizeText(value)) {
    return `${label} is required.`;
  }
  return null;
}

export function validatePiAmount(amount: number, label = 'Amount'): string | null {
  if (!Number.isFinite(amount) || Number.isNaN(amount)) {
    return `${label} must be a valid number.`;
  }
  if (amount < 0) {
    return `${label} cannot be negative.`;
  }
  if (amount < 0.1 || amount > 1000) {
    return `${label} must be between 0.1 Pi and 1000 Pi.`;
  }
  return null;
}

export function validateWorkersCount(workers: number): string | null {
  if (!Number.isInteger(workers) || workers < 1 || workers > 500) {
    return 'Number of workers must be a whole number between 1 and 500.';
  }
  return null;
}
