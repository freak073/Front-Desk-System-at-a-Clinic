import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  LoadingSpinner,
  SkeletonListItem,
  SkeletonCard,
  SkeletonTableRow,
  LoadingOverlay,
  LoadingButton,
  PageLoading,
  ErrorState,
  EmptyState,
} from '../LoadingStates';

describe('LoadingStates Components', () => {
  describe('LoadingSpinner', () => {
    it('should render with default size', () => {
      render(<LoadingSpinner />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('should render with custom size', () => {
      render(<LoadingSpinner size="lg" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-12', 'h-12');
    });

    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('custom-class');
    });
  });

  describe('SkeletonListItem', () => {
    it('should render with default props', () => {
      render(<SkeletonListItem />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      
      // Should have 2 lines by default
      const lines = document.querySelectorAll('.h-4.bg-gray-600');
      expect(lines).toHaveLength(2);
    });

    it('should render with custom number of lines', () => {
      render(<SkeletonListItem lines={3} />);
      const lines = document.querySelectorAll('.h-4.bg-gray-600');
      expect(lines).toHaveLength(3);
    });

    it('should render with avatar when showAvatar is true', () => {
      render(<SkeletonListItem showAvatar />);
      const avatar = document.querySelector('.w-10.h-10.bg-gray-600.rounded-full');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('SkeletonCard', () => {
    it('should render skeleton card', () => {
      render(<SkeletonCard />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-surface-800', 'border', 'border-gray-700', 'rounded-lg');
    });

    it('should apply custom className', () => {
      render(<SkeletonCard className="custom-card" />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('custom-card');
    });
  });

  describe('SkeletonTableRow', () => {
    it('should render with default columns', () => {
      render(<SkeletonTableRow />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
      
      // Should have 3 columns by default (4 - 1 for actions)
      const columns = document.querySelectorAll('.h-4.bg-gray-600.rounded.flex-1');
      expect(columns).toHaveLength(3);
    });

    it('should render with custom number of columns', () => {
      render(<SkeletonTableRow columns={5} />);
      const columns = document.querySelectorAll('.h-4.bg-gray-600.rounded.flex-1');
      expect(columns).toHaveLength(4); // 5 - 1 for actions
    });
  });

  describe('LoadingOverlay', () => {
    it('should not render when not visible', () => {
      render(<LoadingOverlay isVisible={false} />);
      const overlay = document.querySelector('.absolute.inset-0');
      expect(overlay).not.toBeInTheDocument();
    });

    it('should render when visible', () => {
      render(<LoadingOverlay isVisible={true} />);
      const overlay = document.querySelector('.absolute.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingOverlay isVisible={true} message="Saving..." />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('LoadingButton', () => {
    it('should render button with children', () => {
      render(<LoadingButton isLoading={false}>Click me</LoadingButton>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<LoadingButton isLoading={true}>Click me</LoadingButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(button).toBeDisabled();
    });

    it('should show loading text when provided', () => {
      render(
        <LoadingButton isLoading={true} loadingText="Saving...">
          Save
        </LoadingButton>
      );
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton isLoading={false} onClick={handleClick}>
          Click me
        </LoadingButton>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not handle click when loading', () => {
      const handleClick = jest.fn();
      render(
        <LoadingButton isLoading={true} onClick={handleClick}>
          Click me
        </LoadingButton>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('PageLoading', () => {
    it('should render skeleton by default', () => {
      render(<PageLoading />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render spinner when showSkeleton is false', () => {
      render(<PageLoading showSkeleton={false} />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render custom number of skeletons', () => {
      render(<PageLoading skeletonCount={3} />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });

    it('should render different skeleton types', () => {
      render(<PageLoading skeletonType="cards" />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('ErrorState', () => {
    it('should render with default props', () => {
      render(<ErrorState />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('An error occurred while loading data')).toBeInTheDocument();
    });

    it('should render with custom title and message', () => {
      render(
        <ErrorState 
          title="Custom Error" 
          message="Custom error message" 
        />
      );
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should render retry button when onRetry is provided', () => {
      const handleRetry = jest.fn();
      render(<ErrorState onRetry={handleRetry} />);
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button when onRetry is not provided', () => {
      render(<ErrorState />);
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('should render with default props', () => {
      render(<EmptyState />);
      expect(screen.getByText('No data found')).toBeInTheDocument();
      expect(screen.getByText('There are no items to display')).toBeInTheDocument();
    });

    it('should render with custom title and message', () => {
      render(
        <EmptyState 
          title="No items" 
          message="Add some items to get started" 
        />
      );
      expect(screen.getByText('No items')).toBeInTheDocument();
      expect(screen.getByText('Add some items to get started')).toBeInTheDocument();
    });

    it('should render action button when provided', () => {
      const handleAction = jest.fn();
      render(
        <EmptyState 
          actionLabel="Add Item" 
          onAction={handleAction} 
        />
      );
      
      const actionButton = screen.getByText('Add Item');
      expect(actionButton).toBeInTheDocument();
      
      fireEvent.click(actionButton);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('should render custom icon when provided', () => {
      const customIcon = <div data-testid="custom-icon">Custom Icon</div>;
      render(<EmptyState icon={customIcon} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });
});