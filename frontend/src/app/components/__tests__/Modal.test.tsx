import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal, { useModalFormData, FormValidationError } from '../Modal';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.confirm
const confirmMock = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: confirmMock
});

describe('Modal', () => {
  const onCloseMock = jest.fn();
  const onBeforeCloseMock = jest.fn();
  const onValidationErrorsChangeMock = jest.fn();
  
  beforeEach(() => {
    onCloseMock.mockClear();
    onBeforeCloseMock.mockClear();
    onValidationErrorsChangeMock.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    confirmMock.mockClear();
  });

  describe('Basic Modal Functionality', () => {
    it('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      const backdrop = document.querySelector('.fixed.inset-0.bg-black') as HTMLElement;
      if (backdrop) fireEvent.click(backdrop);
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('does not close when backdrop is clicked if disableBackdropClose is true', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal" disableBackdropClose={true}>
          <p>Modal content</p>
        </Modal>
      );
      
      const backdrop = document.querySelector('.fixed.inset-0.bg-black') as HTMLElement;
      if (backdrop) fireEvent.click(backdrop);
      
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('focus is trapped and returned to opener', async () => {
      const Wrapper = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <button onClick={() => setOpen(true)} data-testid="opener">Open</button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="Focus Test">
              <button data-testid="inside">Inside</button>
            </Modal>
          </div>
        );
      };
      render(<Wrapper />);
      const opener = screen.getByTestId('opener');
      opener.focus();
      fireEvent.click(opener);
      
      // Wait for focus trap to engage
      await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(document.activeElement).toBe(opener));
    });

    it('focuses initial focus ref when provided', async () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(true);
        const initialFocusRef = React.useRef<HTMLInputElement>(null);
        
        return (
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Focus Test" initialFocusRef={initialFocusRef}>
            <input ref={initialFocusRef} data-testid="focus-target" />
          </Modal>
        );
      };
      
      render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('focus-target')).toHaveFocus();
      });
    });

    it('traps focus within modal', async () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Focus Trap Test">
          <div>
            <button data-testid="first">First</button>
            <button data-testid="second">Second</button>
          </div>
        </Modal>
      );

      const firstButton = screen.getByTestId('first');
      const closeButton = screen.getByLabelText('Close modal');

      // Focus should be within the modal
      await waitFor(() => {
        const focusedElement = document.activeElement;
        const modal = screen.getByRole('dialog');
        expect(modal.contains(focusedElement)).toBe(true);
      });

      // Manually focus first button and verify it works
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Manually focus close button and verify it works
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });
  });

  describe('Form Data Persistence', () => {
    it('saves and loads form data when persistFormData is enabled', () => {
      const formDataKey = 'test-form';
      const testData = { name: 'John Doe', email: 'john@example.com' };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

      const TestForm = ({ persistedData, saveFormData }: any) => {
        React.useEffect(() => {
          if (saveFormData) {
            saveFormData({ name: 'Jane Doe' });
          }
        }, [saveFormData]);

        return <div>Form with data: {persistedData?.name}</div>;
      };

      render(
        <Modal 
          isOpen={true} 
          onClose={onCloseMock} 
          title="Form Test"
          persistFormData={true}
          formDataKey={formDataKey}
        >
          <TestForm />
        </Modal>
      );

      expect(localStorageMock.getItem).toHaveBeenCalledWith(`modal-form-${formDataKey}`);
    });

    it('shows unsaved changes indicator when form data is modified', () => {
      const TestForm = ({ saveFormData }: any) => {
        React.useEffect(() => {
          if (saveFormData) {
            saveFormData({ name: 'Modified Data' });
          }
        }, [saveFormData]);

        return <div>Form content</div>;
      };

      render(
        <Modal 
          isOpen={true} 
          onClose={onCloseMock} 
          title="Form Test"
          persistFormData={true}
          formDataKey="test-form"
        >
          <TestForm />
        </Modal>
      );

      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });

    it('prompts for confirmation when closing with unsaved changes', () => {
      confirmMock.mockReturnValue(false); // User cancels

      const TestForm = ({ saveFormData }: any) => {
        React.useEffect(() => {
          if (saveFormData) {
            saveFormData({ name: 'Modified Data' });
          }
        }, [saveFormData]);

        return <div>Form content</div>;
      };

      render(
        <Modal 
          isOpen={true} 
          onClose={onCloseMock} 
          title="Form Test"
          persistFormData={true}
          formDataKey="test-form"
        >
          <TestForm />
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(confirmMock).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to close?');
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it('clears persisted data when modal closes successfully', () => {
      confirmMock.mockReturnValue(true); // User confirms

      const TestForm = ({ saveFormData }: any) => {
        React.useEffect(() => {
          if (saveFormData) {
            saveFormData({ name: 'Modified Data' });
          }
        }, [saveFormData]);

        return <div>Form content</div>;
      };

      render(
        <Modal 
          isOpen={true} 
          onClose={onCloseMock} 
          title="Form Test"
          persistFormData={true}
          formDataKey="test-form"
        >
          <TestForm />
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('modal-form-test-form');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe('Validation Errors', () => {
    it('displays validation errors when provided', () => {
      const validationErrors: FormValidationError[] = [
        { field: 'Name', message: 'Name is required' },
        { field: 'Email', message: 'Invalid email format' }
      ];

      render(
        <Modal 
          isOpen={true} 
          onClose={onCloseMock} 
          title="Form Test"
          validationErrors={validationErrors}
        >
          <div>Form content</div>
        </Modal>
      );

      expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('does not display validation errors section when no errors', () => {
      render(
        <Modal 
          isOpen={true} 
          onClose={onCloseMock} 
          title="Form Test"
          validationErrors={[]}
        >
          <div>Form content</div>
        </Modal>
      );

      expect(screen.queryByText('Please fix the following errors:')).not.toBeInTheDocument();
    });
  });

  describe('Enhanced Styling and Behavior', () => {
    it('applies blur background effect when blurBackground is true', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal" blurBackground={true}>
          <p>Modal content</p>
        </Modal>
      );

      const backdrop = document.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('does not apply blur background effect when blurBackground is false', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal" blurBackground={false}>
          <p>Modal content</p>
        </Modal>
      );

      const backdrop = document.querySelector('.backdrop-blur-sm');
      expect(backdrop).not.toBeInTheDocument();
    });

    it('prevents background interaction when preventBackgroundInteraction is true', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal" preventBackgroundInteraction={true}>
          <p>Modal content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('renders different sizes correctly', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal" size="sm">
          <p>Modal content</p>
        </Modal>
      );

      expect(document.querySelector('.max-w-md')).toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal" size="lg">
          <p>Modal content</p>
        </Modal>
      );

      expect(document.querySelector('.max-w-2xl')).toBeInTheDocument();
    });
  });

  describe('onBeforeClose callback', () => {
    it('prevents closing when onBeforeClose returns false', () => {
      onBeforeCloseMock.mockReturnValue(false);

      render(
        <Modal 
          isOpen={true} 
          onClose={onCloseMock} 
          title="Test Modal"
          onBeforeClose={onBeforeCloseMock}
        >
          <p>Modal content</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onBeforeCloseMock).toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it('allows closing when onBeforeClose returns true or undefined', () => {
      onBeforeCloseMock.mockReturnValue(true);

      render(
        <Modal 
          isOpen={true} 
          onClose={onCloseMock} 
          title="Test Modal"
          onBeforeClose={onBeforeCloseMock}
        >
          <p>Modal content</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onBeforeCloseMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});

describe('useModalFormData hook', () => {
  const TestComponent = ({ formDataKey }: { formDataKey: string }) => {
    const {
      formData,
      hasUnsavedChanges,
      saveFormData,
      loadFormData,
      clearFormData,
      updateFormField
    } = useModalFormData(formDataKey);

    return (
      <div>
        <div data-testid="form-data">{JSON.stringify(formData)}</div>
        <div data-testid="has-changes">{hasUnsavedChanges.toString()}</div>
        <button onClick={() => saveFormData({ name: 'Test' })} data-testid="save">Save</button>
        <button onClick={() => loadFormData()} data-testid="load">Load</button>
        <button onClick={() => clearFormData()} data-testid="clear">Clear</button>
        <button onClick={() => updateFormField('email', 'test@example.com')} data-testid="update">Update</button>
      </div>
    );
  };

  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('saves form data to localStorage', () => {
    render(<TestComponent formDataKey="test-hook" />);

    const saveButton = screen.getByTestId('save');
    fireEvent.click(saveButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'modal-form-test-hook',
      JSON.stringify({ name: 'Test' })
    );
    expect(screen.getByTestId('has-changes')).toHaveTextContent('true');
  });

  it('loads form data from localStorage', () => {
    const testData = { name: 'Loaded Data' };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

    render(<TestComponent formDataKey="test-hook" />);

    const loadButton = screen.getByTestId('load');
    fireEvent.click(loadButton);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('modal-form-test-hook');
    expect(screen.getByTestId('form-data')).toHaveTextContent(JSON.stringify(testData));
  });

  it('clears form data from localStorage', () => {
    render(<TestComponent formDataKey="test-hook" />);

    const clearButton = screen.getByTestId('clear');
    fireEvent.click(clearButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('modal-form-test-hook');
    expect(screen.getByTestId('has-changes')).toHaveTextContent('false');
  });

  it('updates individual form fields', () => {
    render(<TestComponent formDataKey="test-hook" />);

    const updateButton = screen.getByTestId('update');
    fireEvent.click(updateButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'modal-form-test-hook',
      JSON.stringify({ email: 'test@example.com' })
    );
  });
});