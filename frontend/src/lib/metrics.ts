export interface MetricEvent { name: string; duration?: number; timestamp: number; meta?: Record<string, any>; }

const listeners: ((e: MetricEvent)=>void)[] = [];
export function onMetric(l: (e: MetricEvent)=>void) { listeners.push(l); return () => { const i=listeners.indexOf(l); if(i>=0) listeners.splice(i,1); }; }

export function logMetric(e: MetricEvent) {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.info('[metric]', e.name, e.duration ?? '', e.meta || {});
  }
  listeners.forEach(l => { try { l(e); } catch { /* ignore */ } });
}

export function timeMetric<T>(name: string, fn: () => Promise<T> | T, meta?: Record<string, any>): Promise<T> | T {
  const start = performance.now();
  const end = (ok=true) => logMetric({ name, duration: performance.now() - start, timestamp: Date.now(), meta: { ok, ...(meta||{}) } });
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(r => { end(true); return r; }).catch(err => { end(false); throw err; });
    }
    end(true); return result;
  } catch (e) { end(false); throw e; }
}
