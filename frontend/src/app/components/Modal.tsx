'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface FormValidationError {
  field: string;
  message: string;
}

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
  // Form data persistence
  persistFormData?: boolean;
  formDataKey?: string; // unique key for storing form data
  // Validation support
  validationErrors?: FormValidationError[];
  onValidationErrorsChange?: (errors: FormValidationError[]) => void;
  // Enhanced styling
  blurBackground?: boolean;
  preventBackgroundInteraction?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  initialFocusRef, 
  describedById, 
  disableBackdropClose = false, 
  confirmOnClose = false, 
  onBeforeClose,
  persistFormData = false,
  formDataKey,
  validationErrors = [],
  onValidationErrorsChange,
  blurBackground = true,
  preventBackgroundInteraction = true
}) => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [persistedData, setPersistedData] = useState<Record<string, any>>({});

  // Form data persistence
  useEffect(() => {
    if (persistFormData && formDataKey && isOpen) {
      const savedData = localStorage.getItem(`modal-form-${formDataKey}`);
      if (savedData) {
        try {
          setPersistedData(JSON.parse(savedData));
        } catch (error) {
          console.warn('Failed to parse persisted form data:', error);
        }
      }
    }
  }, [persistFormData, formDataKey, isOpen]);

  // Save form data to localStorage
  const saveFormData = useCallback((data: Record<string, any>) => {
    if (persistFormData && formDataKey) {
      localStorage.setItem(`modal-form-${formDataKey}`, JSON.stringify(data));
      setPersistedData(data);
      setHasUnsavedChanges(true);
    }
  }, [persistFormData, formDataKey]);

  // Clear persisted form data
  const clearPersistedData = useCallback(() => {
    if (persistFormData && formDataKey) {
      localStorage.removeItem(`modal-form-${formDataKey}`);
      setPersistedData({});
      setHasUnsavedChanges(false);
    }
  }, [persistFormData, formDataKey]);

  // Enhanced close handler with unsaved changes check
  const handleClose = useCallback(() => {
    if (onBeforeClose) {
      const result = onBeforeClose();
      if (result === false) return;
    }

    if (confirmOnClose || (hasUnsavedChanges && persistFormData)) {
      const message = hasUnsavedChanges 
        ? 'You have unsaved changes. Are you sure you want to close?' 
        : 'Are you sure you want to close?';
      
      if (!window.confirm(message)) return;
    }

    // Clear persisted data on successful close
    if (persistFormData) {
      clearPersistedData();
    }

    onClose();
  }, [onBeforeClose, confirmOnClose, hasUnsavedChanges, persistFormData, clearPersistedData, onClose]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen && typeof document !== 'undefined') {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEsc);
      
      if (preventBackgroundInteraction) {
        document.body.style.overflow = 'hidden';
      }
      
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
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', handleEsc);
        if (preventBackgroundInteraction) {
          document.body.style.overflow = 'unset';
        }
      }
      // Return focus
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, handleClose, initialFocusRef, preventBackgroundInteraction]);

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
        if (typeof document !== 'undefined' && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (typeof document !== 'undefined' && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isOpen]);

  // Handle click outside modal
  const handleClickOutside = (event: React.MouseEvent) => {
    if (disableBackdropClose) return;
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      handleClose();
    }
  };

  // Validation error display component
  const ValidationErrors: React.FC<{ errors: FormValidationError[] }> = ({ errors }) => {
    if (!errors.length) return null;

    return (
      <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
        <div className="flex items-center mb-2">
          <svg className="w-4 h-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h4 className="text-sm font-medium text-red-400">Please fix the following errors:</h4>
        </div>
        <ul className="text-sm text-red-300 space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span><strong>{error.field}:</strong> {error.message}</span>
            </li>
          ))}
        </ul>
      </div>
    );
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
      {/* Enhanced Backdrop with blur effect */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-all duration-300 ${
          blurBackground ? 'backdrop-blur-sm' : ''
        }`}
        onClick={handleClickOutside}
        role={disableBackdropClose ? undefined : 'button'}
        tabIndex={disableBackdropClose ? -1 : 0}
        aria-label={disableBackdropClose ? undefined : 'Close modal backdrop'}
        onKeyDown={(e) => {
          if (disableBackdropClose) return;
          const activate = e.key === 'Enter' || e.key === ' ';
          if (activate) {
            e.preventDefault();
            handleClose();
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
          className={`relative bg-surface-800 border border-gray-700 rounded-lg shadow-xl transform transition-all duration-300 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto focus:outline-none animate-in fade-in-0 zoom-in-95`}
          aria-labelledby="modal-title"
          {...(describedById ? { 'aria-describedby': describedById } : {})}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 rounded-t">
            <div className="flex items-center">
              <h3 id="modal-title" className="text-xl font-semibold text-gray-100">
                {title}
              </h3>
              {hasUnsavedChanges && persistFormData && (
                <span className="ml-2 px-2 py-1 text-xs bg-yellow-600 text-yellow-100 rounded-full">
                  Unsaved changes
                </span>
              )}
            </div>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-surface-700 hover:text-gray-100 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors"
              onClick={handleClose}
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Modal body */}
          <div className="p-4">
            {/* Validation errors display */}
            <ValidationErrors errors={validationErrors} />
            
            {/* Modal content with form data persistence context */}
            {React.isValidElement(children) && typeof children.type === 'function' ? 
              React.cloneElement(children, {
                persistedData,
                saveFormData,
                clearPersistedData,
                setHasUnsavedChanges,
                validationErrors,
                onValidationErrorsChange
              }) : 
              children
            }
          </div>
        </dialog>
      </div>
    </div>
  );
};

// Hook for managing modal form data persistence
export const useModalFormData = (formDataKey: string) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveFormData = useCallback((data: Record<string, any>) => {
    localStorage.setItem(`modal-form-${formDataKey}`, JSON.stringify(data));
    setFormData(data);
    setHasUnsavedChanges(true);
  }, [formDataKey]);

  const loadFormData = useCallback(() => {
    const savedData = localStorage.getItem(`modal-form-${formDataKey}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        return parsed;
      } catch (error) {
        console.warn('Failed to parse persisted form data:', error);
      }
    }
    return {};
  }, [formDataKey]);

  const clearFormData = useCallback(() => {
    localStorage.removeItem(`modal-form-${formDataKey}`);
    setFormData({});
    setHasUnsavedChanges(false);
  }, [formDataKey]);

  const updateFormField = useCallback((field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    saveFormData(newData);
  }, [formData, saveFormData]);

  return {
    formData,
    hasUnsavedChanges,
    saveFormData,
    loadFormData,
    clearFormData,
    updateFormField,
    setHasUnsavedChanges
  };
};

export default Modal;
export type { FormValidationError, ModalProps };