'use client';

import React, { useState } from 'react';
import Modal, { useModalFormData, FormValidationError } from './Modal';

interface ExampleFormProps {
  persistedData?: Record<string, any>;
  saveFormData?: (data: Record<string, any>) => void;
  clearPersistedData?: () => void;
  setHasUnsavedChanges?: (hasChanges: boolean) => void;
  validationErrors?: FormValidationError[];
  onValidationErrorsChange?: (errors: FormValidationError[]) => void;
}

const ExampleForm: React.FC<ExampleFormProps> = ({
  persistedData = {},
  saveFormData,
  setHasUnsavedChanges,
  validationErrors = [],
  onValidationErrorsChange
}) => {
  const [formData, setFormData] = useState({
    name: persistedData.name || '',
    email: persistedData.email || '',
    message: persistedData.message || ''
  });

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Save to persistence
    if (saveFormData) {
      saveFormData(newData);
    }
    
    // Mark as having unsaved changes
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }

    // Clear validation errors for this field
    if (onValidationErrorsChange) {
      const newErrors = validationErrors.filter(error => error.field !== field);
      onValidationErrorsChange(newErrors);
    }
  };

  const validateForm = (): FormValidationError[] => {
    const errors: FormValidationError[] = [];
    
    if (!formData.name.trim()) {
      errors.push({ field: 'Name', message: 'Name is required' });
    }
    
    if (!formData.email.trim()) {
      errors.push({ field: 'Email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push({ field: 'Email', message: 'Invalid email format' });
    }
    
    if (!formData.message.trim()) {
      errors.push({ field: 'Message', message: 'Message is required' });
    }
    
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (onValidationErrorsChange) {
      onValidationErrorsChange(errors);
    }
    
    if (errors.length === 0) {
      // Form is valid, submit the data
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
      
      // Clear form and persistence
      setFormData({ name: '', email: '', message: '' });
      if (saveFormData) {
        saveFormData({});
      }
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-surface-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="Enter your name"
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-surface-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="Enter your email"
        />
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
          Message
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-surface-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="Enter your message"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          className="px-4 py-2 text-gray-300 bg-surface-700 hover:bg-surface-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
          onClick={() => {
            setFormData({ name: '', email: '', message: '' });
            if (saveFormData) {
              saveFormData({});
            }
            if (setHasUnsavedChanges) {
              setHasUnsavedChanges(false);
            }
            if (onValidationErrorsChange) {
              onValidationErrorsChange([]);
            }
          }}
        >
          Clear
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

const ModalFormExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FormValidationError[]>([]);

  const handleBeforeClose = () => {
    // You can add custom logic here to prevent closing
    // Return false to prevent closing
    return true;
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-4">Modal Form Example</h1>
      <p className="text-gray-300 mb-6">
        This example demonstrates the enhanced Modal component with form data persistence,
        validation error display, and unsaved changes detection.
      </p>
      
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
        Open Modal Form
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Contact Form"
        size="md"
        persistFormData={true}
        formDataKey="contact-form"
        validationErrors={validationErrors}
        onValidationErrorsChange={setValidationErrors}
        blurBackground={true}
        preventBackgroundInteraction={true}
        onBeforeClose={handleBeforeClose}
      >
        <ExampleForm />
      </Modal>
    </div>
  );
};

export default ModalFormExample;