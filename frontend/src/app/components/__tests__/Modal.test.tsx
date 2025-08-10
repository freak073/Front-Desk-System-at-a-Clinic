import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal', () => {
  const onCloseMock = jest.fn();
  
  beforeEach(() => {
    onCloseMock.mockClear();
  });

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
    
    const closeButton = screen.getByLabelText('Close');
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
    
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('focus is trapped and returned to opener', async () => {
    const Wrapper = () => {
      const [open,setOpen] = React.useState(false);
      return (
        <div>
          <button onClick={()=>setOpen(true)} data-testid="opener">Open</button>
          <Modal isOpen={open} onClose={()=>setOpen(false)} title="Focus Test">
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
  await waitFor(()=> expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
  fireEvent.keyDown(document, { key:'Escape' });
  await waitFor(()=> expect(document.activeElement).toBe(opener));
  });
});