export interface ApiEnvelope<T> { success: boolean; data: T; meta?: Record<string, any>; }

export function unwrapEnvelope<T>(value: any): T {
  if (value && typeof value === 'object' && 'success' in value && 'data' in value) {
    return value.data as T;
  }
  return value as T;
}

export function unwrapWithMeta<T>(value: any): { data: T; meta?: Record<string, any> } {
  if (value && typeof value === 'object' && 'success' in value && 'data' in value) {
    const { data, meta } = value as ApiEnvelope<T>;
    return { data, meta };
  }
  return { data: value as T };
}
