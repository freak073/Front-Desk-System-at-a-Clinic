import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastProvider';

const TestComponent = () => {
  const { success, error, info } = useToast();
  return (
    <div>
      <button onClick={() => success('Success message', 100)}>Show Success</button>
      <button onClick={() => error('Error message', 100)}>Show Error</button>
      <button onClick={() => info('Info message', 100)}>Show Info</button>
    </div>
  );
};

describe('ToastProvider', () => {
  jest.useFakeTimers();
  it('renders and auto-dismisses toasts', () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);
    act(()=>{
      screen.getByText('Show Success').click();
      screen.getByText('Show Error').click();
      screen.getByText('Show Info').click();
    });
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
    act(()=>{
      jest.advanceTimersByTime(150);
    });
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
  });
});
