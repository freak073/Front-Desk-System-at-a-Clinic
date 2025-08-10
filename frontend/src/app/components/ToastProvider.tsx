"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  createdAt: number;
}
interface ToastContextValue {
  show: (message: string, type?: Toast['type'], ttlMs?: number) => void;
  success: (message: string, ttlMs?: number) => void;
  error: (message: string, ttlMs?: number) => void;
  info: (message: string, ttlMs?: number) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);
  const show = useCallback((message: string, type: Toast['type'] = 'info', ttlMs: number = 4000) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, message, type, createdAt: Date.now() };
    setToasts(t => [...t, toast]);
    setTimeout(() => remove(id), ttlMs);
  }, [remove]);
  const value: ToastContextValue = useMemo(()=>({
    show,
    success: (m, ttl) => show(m, 'success', ttl),
    error: (m, ttl) => show(m, 'error', ttl),
    info: (m, ttl) => show(m, 'info', ttl)
  }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <section className="fixed top-4 right-4 z-50 space-y-2 w-80" aria-label="Notifications">
          {toasts.map(t => {
            let borderClass = 'border-blue-300';
            if (t.type === 'success') borderClass = 'border-green-300';
            else if (t.type === 'error') borderClass = 'border-red-300';
            let dotClass = 'bg-blue-500';
            if (t.type === 'success') dotClass = 'bg-green-500';
            else if (t.type === 'error') dotClass = 'bg-red-500';
            return (
              <div key={t.id} className={`flex items-start gap-2 p-3 rounded shadow text-sm animate-fade-in border bg-white ${borderClass}`}> 
                <span className={`mt-0.5 inline-block w-2 h-2 rounded-full ${dotClass}`} />
                <div className="flex-1">{t.message}</div>
                <button onClick={() => remove(t.id)} aria-label="Dismiss notification" className="text-gray-400 hover:text-gray-600">×</button>
              </div>
            );
          })}
        </section>, document.body)
      }
    </ToastContext.Provider>
  );
};
