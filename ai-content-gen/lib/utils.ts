export function parseJsonObject<T = unknown>(text: string): T {
  const obj = JSON.parse(text);
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('Expected a JSON object');
  }
  return obj as T;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function toStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  const arr = value.map((v) => {
    if (!isNonEmptyString(v)) throw new Error(`${label} items must be non-empty strings`);
    return v.trim();
  });
  return arr;
}

