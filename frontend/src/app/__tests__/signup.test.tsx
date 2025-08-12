import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '../login/page';
import { AuthProvider } from '../../context/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API service
jest.mock('../../lib/api', () => ({
  apiService: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

describe('Signup Functionality', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
  };

  it('should toggle between login and signup modes', () => {
    renderLoginPage();
    
    // Initially should be in login mode
    expect(screen.getByText('Login to Front Desk System')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Click signup toggle
    fireEvent.click(screen.getByText('Need an account? Sign up here'));
    
    // Should switch to signup mode
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Create Account', { selector: 'button' })).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
  });

  it('should show signup form fields in signup mode', () => {
    renderLoginPage();
    
    // Switch to signup mode
    fireEvent.click(screen.getByText('Need an account? Sign up here'));
    
    // Check all signup fields are present
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    
    // Check role options
    const roleSelect = screen.getByLabelText('Role') as HTMLSelectElement;
    expect(roleSelect.value).toBe('staff'); // Default value
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should validate signup form inputs', async () => {
    renderLoginPage();
    
    // Switch to signup mode
    fireEvent.click(screen.getByText('Need an account? Sign up here'));
    
    // Try to submit empty form
    fireEvent.click(screen.getByText('Create Account', { selector: 'button' }));
    
    await waitFor(() => {
      expect(screen.getByText('Please enter both username and password.')).toBeInTheDocument();
    });
    
    // Test short username
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ab' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByText('Create Account', { selector: 'button' }));
    
    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters long.')).toBeInTheDocument();
    });
    
    // Test invalid username characters
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user-name!' } });
    fireEvent.click(screen.getByText('Create Account', { selector: 'button' }));
    
    await waitFor(() => {
      expect(screen.getByText('Username can only contain letters, numbers, and underscores.')).toBeInTheDocument();
    });
    
    // Test weak password
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'validuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByText('Create Account', { selector: 'button' }));
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters long.')).toBeInTheDocument();
    });
    
    // Test password without required characters
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Create Account', { selector: 'button' }));
    
    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one uppercase letter, one lowercase letter, and one number.')).toBeInTheDocument();
    });
  });

  it('should show password requirements in signup mode', () => {
    renderLoginPage();
    
    // Switch to signup mode
    fireEvent.click(screen.getByText('Need an account? Sign up here'));
    
    // Check password requirements are shown
    expect(screen.getByText('Must be at least 6 characters with uppercase, lowercase, and number')).toBeInTheDocument();
  });

  it('should toggle back to login mode', () => {
    renderLoginPage();
    
    // Switch to signup mode
    fireEvent.click(screen.getByText('Need an account? Sign up here'));
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    
    // Switch back to login mode
    fireEvent.click(screen.getByText('Already have an account? Login here'));
    expect(screen.getByText('Login to Front Desk System')).toBeInTheDocument();
    expect(screen.getByText('Login', { selector: 'button' })).toBeInTheDocument();
    
    // Signup fields should be hidden
    expect(screen.queryByLabelText('Full Name (Optional)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Role')).not.toBeInTheDocument();
  });

  it('should show default credentials in login mode only', () => {
    renderLoginPage();
    
    // Should show default credentials in login mode
    expect(screen.getByText('Default credentials:')).toBeInTheDocument();
    expect(screen.getByText('Admin: admin / Admin123')).toBeInTheDocument();
    expect(screen.getByText('Staff: staff / Staff123')).toBeInTheDocument();
    
    // Switch to signup mode
    fireEvent.click(screen.getByText('Need an account? Sign up here'));
    
    // Should not show default credentials in signup mode
    expect(screen.queryByText('Default credentials:')).not.toBeInTheDocument();
  });
});