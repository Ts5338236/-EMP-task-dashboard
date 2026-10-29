import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardHeader } from './components/DashboardHeader';
import { User } from './types/auth';

const mockAdminUser: User = {
  id: 'admin-1',
  username: 'admin',
  email: 'admin@workflow.local',
  role: 'ADMIN',
  employee_name: 'System Administrator',
  is_active: true,
  created_at: '2026-10-29T00:00:00Z',
  updated_at: '2026-10-29T00:00:00Z',
};

describe('Authentication & Authorization Frontend Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. renders login form with brand header, fields, and quick-fill assistants', () => {
    render(
      <AuthProvider initialUser={null}>
        <LoginPage />
      </AuthProvider>
    );

    expect(screen.getByText('WorkFlow Enterprise')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/admin, manager, or sarah/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter account password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manager' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Employee' })).toBeInTheDocument();
  });

  it('2. validates required username and password fields on submit', async () => {
    render(
      <AuthProvider initialUser={null}>
        <LoginPage />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /Sign In to Dashboard/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please enter your username or email address/i)).toBeInTheDocument();

    const userInput = screen.getByPlaceholderText(/admin, manager, or sarah/i);
    fireEvent.change(userInput, { target: { value: 'admin' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please enter your password/i)).toBeInTheDocument();
  });

  it('3. toggles show/hide password visibility', () => {
    render(
      <AuthProvider initialUser={null}>
        <LoginPage />
      </AuthProvider>
    );

    const passInput = screen.getByPlaceholderText(/Enter account password/i) as HTMLInputElement;
    expect(passInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/Show password/i);
    fireEvent.click(toggleBtn);
    expect(passInput.type).toBe('text');

    const hideBtn = screen.getByLabelText(/Hide password/i);
    fireEvent.click(hideBtn);
    expect(passInput.type).toBe('password');
  });

  it('4. populates credentials on quick-fill button click', () => {
    render(
      <AuthProvider initialUser={null}>
        <LoginPage />
      </AuthProvider>
    );

    const managerBtn = screen.getByRole('button', { name: 'Manager' });
    fireEvent.click(managerBtn);

    const userInput = screen.getByPlaceholderText(/admin, manager, or sarah/i) as HTMLInputElement;
    const passInput = screen.getByPlaceholderText(/Enter account password/i) as HTMLInputElement;

    expect(userInput.value).toBe('manager');
    expect(passInput.value).toBe('Manager@Workflow2026!');
  });

  it('5. displays friendly error message on failed login response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Invalid username/email or password' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(
      <AuthProvider initialUser={null}>
        <LoginPage />
      </AuthProvider>
    );

    const userInput = screen.getByPlaceholderText(/admin, manager, or sarah/i);
    const passInput = screen.getByPlaceholderText(/Enter account password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Dashboard/i });

    fireEvent.change(userInput, { target: { value: 'unknown_user' } });
    fireEvent.change(passInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Invalid username\/email or password/i)).toBeInTheDocument();
  });

  it('6. renders user role badge, name, and logout button in DashboardHeader', () => {
    const handleRefresh = vi.fn();
    const handleOpenMobile = vi.fn();
    const handleOpenAdmin = vi.fn();

    render(
      <AuthProvider initialUser={mockAdminUser}>
        <DashboardHeader
          onRefresh={handleRefresh}
          refreshing={false}
          lastUpdated={new Date()}
          onOpenMobileMenu={handleOpenMobile}
          onOpenAdmin={handleOpenAdmin}
        />
      </AuthProvider>
    );

    expect(screen.getByText('System Administrator')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByLabelText('Logout')).toBeInTheDocument();
    expect(screen.getByLabelText('Open User Management')).toBeInTheDocument();
  });
});

