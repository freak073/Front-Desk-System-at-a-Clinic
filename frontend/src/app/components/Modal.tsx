'use client';

import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initialFocusRef?: React.RefObject<HTMLElement>;
  describedById?: string; // id of element describing the modal
  disableBackdropClose?: boolean;
  confirmOnClose?: boolean; // if true ask for confirmation before closing
  onBeforeClose?: () => boolean | void; // return false to prevent close
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', initialFocusRef, describedById, disableBackdropClose, confirmOnClose, onBeforeClose }) => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      // Focus management
      setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (modalRef.current) {
          const focusable = modalRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
            focusable?.focus();
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
      // Return focus
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, onClose, initialFocusRef]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (!modalRef.current) return;
      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled'));
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle click outside modal
  const attemptClose = () => {
    if (onBeforeClose) {
      const result = onBeforeClose();
      if (result === false) return;
    }
    if (confirmOnClose && !window.confirm('Discard changes?')) return;
    onClose();
  };

  const handleClickOutside = (event: React.MouseEvent) => {
    if (disableBackdropClose) return;
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      attemptClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClickOutside}
        role={disableBackdropClose ? undefined : 'button'}
        tabIndex={disableBackdropClose ? -1 : 0}
        aria-label={disableBackdropClose ? undefined : 'Close modal backdrop'}
        onKeyDown={(e) => {
          if (disableBackdropClose) return;
          const activate = e.key === 'Enter' || e.key === ' ';
          if (activate) {
            e.preventDefault();
            onClose();
          }
        }}
        aria-hidden={disableBackdropClose ? true : undefined}
      />
      
      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Modal content */}
        <dialog
          ref={modalRef}
          open
          className={`relative bg-surface-800 border border-gray-700 rounded-lg shadow-xl transform transition-all w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto focus:outline-none`}
          aria-labelledby="modal-title"
          {...(describedById ? { 'aria-describedby': describedById } : {})}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between p-4 border-b rounded-t">
            <h3 id="modal-title" className="text-xl font-semibold text-gray-100">
              {title}
            </h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-surface-700 hover:text-gray-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center focus:outline-none focus:ring-2 focus:ring-accent-500"
              onClick={attemptClose}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Modal body */}
          <div className="p-4">
            {children}
          </div>
  </dialog>
      </div>
    </div>
  );
};

export default Modal;