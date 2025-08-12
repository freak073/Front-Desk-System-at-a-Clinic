'use client';

import React, { useState } from 'react';
import Modal, { FormValidationError } from './Modal';

const SimpleModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FormValidationError[]>([]);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: FormValidationError[] = [];
    if (!formData.name.trim()) {
      errors.push({ field: 'Name', message: 'Name is required' });
    }
    if (!formData.email.trim()) {
      errors.push({ field: 'Email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push({ field: 'Email', message: 'Invalid email format' });
    }
    
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      alert('Form submitted successfully!');
      setFormData({ name: '', email: '' });
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-4">Simple Modal Example</h1>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-md transition-colors"
      >
        Open Modal
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Simple Form"
        validationErrors={validationErrors}
        onValidationErrorsChange={setValidationErrors}
        blurBackground={true}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-surface-700 text-gray-100"
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-surface-700 text-gray-100"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-300 bg-surface-700 hover:bg-surface-600 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-md"
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SimpleModalExample;