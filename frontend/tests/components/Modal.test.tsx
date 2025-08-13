import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Modal from '@/app/components/Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);
    
    const backdrop = screen.getByTestId('modal-backdrop');
    await user.click(backdrop);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);
    
    await user.keyboard('{Escape}');
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when clicking inside modal content', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);
    
    const modalContent = screen.getByText('Modal Content');
    await user.click(modalContent);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should have proper ARIA attributes', () => {
    render(<Modal {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    
    const title = screen.getByText('Test Modal');
    expect(title).toHaveAttribute('id');
  });

  it('should trap focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button>Outside Button</button>
        <Modal {...defaultProps}>
          <button>Inside Button 1</button>
          <button>Inside Button 2</button>
        </Modal>
      </div>
    );
    
    const insideButton1 = screen.getByText('Inside Button 1');
    const insideButton2 = screen.getByText('Inside Button 2');
    const closeButton = screen.getByRole('button', { name: /close/i });
    
    // Focus should start on first focusable element
    expect(insideButton1).toHaveFocus();
    
    // Tab should cycle through modal elements
    await user.tab();
    expect(insideButton2).toHaveFocus();
    
    await user.tab();
    expect(closeButton).toHaveFocus();
    
    // Tab should cycle back to first element
    await user.tab();
    expect(insideButton1).toHaveFocus();
  });

  it('should restore focus to trigger element when closed', async () => {
    const user = userEvent.setup();
    const TriggerComponent = () => {
      const [isOpen, setIsOpen] = React.useState(false);
      
      return (
        <div>
          <button onClick={() => setIsOpen(true)}>Open Modal</button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Test Modal"
          >
            <div>Content</div>
          </Modal>
        </div>
      );
    };
    
    render(<TriggerComponent />);
    
    const triggerButton = screen.getByText('Open Modal');
    await user.click(triggerButton);
    
    // Modal should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Close modal
    await user.keyboard('{Escape}');
    
    // Focus should return to trigger button
    await waitFor(() => {
      expect(triggerButton).toHaveFocus();
    });
  });

  it('should prevent body scroll when open', () => {
    render(<Modal {...defaultProps} />);
    
    expect(document.body).toHaveStyle('overflow: hidden');
  });

  it('should restore body scroll when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    
    expect(document.body).toHaveStyle('overflow: hidden');
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    
    expect(document.body).not.toHaveStyle('overflow: hidden');
  });

  it('should handle multiple modals correctly', () => {
    render(
      <div>
        <Modal isOpen={true} onClose={jest.fn()} title="Modal 1">
          <div>Content 1</div>
        </Modal>
        <Modal isOpen={true} onClose={jest.fn()} title="Modal 2">
          <div>Content 2</div>
        </Modal>
      </div>
    );
    
    const modals = screen.getAllByRole('dialog');
    expect(modals).toHaveLength(2);
  });

  it('should support custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal" />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('custom-modal');
  });

  it('should handle form submission within modal', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    
    render(
      <Modal {...defaultProps}>
        <form onSubmit={onSubmit}>
          <input name="test" />
          <button type="submit">Submit</button>
        </form>
      </Modal>
    );
    
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByText('Submit');
    
    await user.type(input, 'test value');
    await user.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should be accessible with screen readers', () => {
    render(<Modal {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    
    // Should have accessible name
    const title = screen.getByText('Test Modal');
    expect(dialog).toHaveAttribute('aria-labelledby', title.id);
  });
});