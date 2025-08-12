import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TouchFriendlyButton from '../TouchFriendlyButton';

describe('TouchFriendlyButton', () => {
  it('renders with correct minimum touch target size', () => {
    render(<TouchFriendlyButton>Click me</TouchFriendlyButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-w-[44px]', 'min-h-[44px]');
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<TouchFriendlyButton onClick={mockOnClick}>Click me</TouchFriendlyButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    render(<TouchFriendlyButton loading={true}>Click me</TouchFriendlyButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toBeInTheDocument(); // Loading spinner
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<TouchFriendlyButton variant="primary">Primary</TouchFriendlyButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-accent-600');

    rerender(<TouchFriendlyButton variant="danger">Danger</TouchFriendlyButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger-600');
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<TouchFriendlyButton size="sm">Small</TouchFriendlyButton>);
    expect(screen.getByRole('button')).toHaveClass('text-sm');

    rerender(<TouchFriendlyButton size="lg">Large</TouchFriendlyButton>);
    expect(screen.getByRole('button')).toHaveClass('text-base');
  });

  it('is disabled when disabled prop is true', () => {
    render(<TouchFriendlyButton disabled={true}>Disabled</TouchFriendlyButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<TouchFriendlyButton className="custom-class">Custom</TouchFriendlyButton>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('sets correct aria-label', () => {
    render(<TouchFriendlyButton aria-label="Custom label">Button</TouchFriendlyButton>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label');
  });
});