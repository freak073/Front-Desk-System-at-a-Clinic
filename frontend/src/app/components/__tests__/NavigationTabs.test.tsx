import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import NavigationTabs from '../NavigationTabs';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('NavigationTabs', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);

    mockPush.mockClear();
  });

  it('renders all navigation tabs when on management pages', () => {
    mockUsePathname.mockReturnValue('/dashboard/queue');

    render(<NavigationTabs />);

    expect(screen.getByText('Dashboard Home')).toBeInTheDocument();
    expect(screen.getByText('Queue Management')).toBeInTheDocument();
    expect(screen.getByText('Appointment Management')).toBeInTheDocument();
    expect(screen.getByText('Doctor Management')).toBeInTheDocument();
  });

  it('hides home button when on dashboard home page', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<NavigationTabs />);

    expect(screen.queryByText('Dashboard Home')).not.toBeInTheDocument();
    expect(screen.getByText('Queue Management')).toBeInTheDocument();
    expect(screen.getByText('Appointment Management')).toBeInTheDocument();
    expect(screen.getByText('Doctor Management')).toBeInTheDocument();
  });

  it('highlights active tab correctly', () => {
    mockUsePathname.mockReturnValue('/dashboard/queue');

    render(<NavigationTabs />);

    const queueTab = screen.getByRole('tab', { name: /queue management/i });
    const appointmentTab = screen.getByRole('tab', { name: /appointment management/i });

    expect(queueTab).toHaveAttribute('aria-selected', 'true');
    expect(appointmentTab).toHaveAttribute('aria-selected', 'false');
  });

  it('shows correct active state for appointments tab', () => {
    mockUsePathname.mockReturnValue('/dashboard/appointments');

    render(<NavigationTabs />);

    const appointmentTab = screen.getByRole('tab', { name: /appointment management/i });
    expect(appointmentTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows correct active state for doctors tab', () => {
    mockUsePathname.mockReturnValue('/dashboard/doctors');

    render(<NavigationTabs />);

    const doctorTab = screen.getByRole('tab', { name: /doctor management/i });
    expect(doctorTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows correct active state for dashboard home tab', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<NavigationTabs />);

    const homeTab = screen.getByRole('tab', { name: /dashboard home/i });
    expect(homeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('handles nested routes correctly', () => {
    mockUsePathname.mockReturnValue('/dashboard/appointments/new');

    render(<NavigationTabs />);

    const appointmentTab = screen.getByRole('tab', { name: /appointment management/i });
    expect(appointmentTab).toHaveAttribute('aria-selected', 'true');
  });

  it('has proper accessibility attributes on management pages', () => {
    mockUsePathname.mockReturnValue('/dashboard/queue');

    render(<NavigationTabs />);

    const nav = screen.getByRole('tablist');
    expect(nav).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);

    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('has proper accessibility attributes on dashboard home', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<NavigationTabs />);

    const nav = screen.getByRole('tablist');
    expect(nav).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3); // No home button on dashboard home

    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('shows short names on mobile screens', () => {
    mockUsePathname.mockReturnValue('/dashboard/queue');

    render(<NavigationTabs />);

    // Check that both full names and short names are present
    expect(screen.getByText('Dashboard Home')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Queue Management')).toBeInTheDocument();
    expect(screen.getByText('Queue')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    mockUsePathname.mockReturnValue('/dashboard/queue');

    const { container } = render(<NavigationTabs className="custom-class" />);

    const navContainer = container.firstChild as HTMLElement;
    expect(navContainer).toHaveClass('custom-class');
  });

  it('handles focus management correctly', () => {
    mockUsePathname.mockReturnValue('/dashboard/queue');

    render(<NavigationTabs />);

    const queueTab = screen.getByRole('tab', { name: /queue management/i });

    queueTab.focus();
    expect(queueTab).toHaveFocus();
  });
});