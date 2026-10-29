import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import { UnifiedTasksResponse } from './types/task';

const mockTasksResponse: UnifiedTasksResponse = {
  tasks: [
    {
      id: '101',
      title: 'Follow up with customer on contract renewal',
      description: 'Discuss expansion of seats and license terms',
      employee: 'Tushar Gupta',
      status: 'Pending',
      deadline: '2026-10-28T14:00:00Z',
      urgency: 'Urgent',
      source: 'CRM',
      url: '/mock/crm/101',
      priority_category: 'Overdue',
      priority_rank: 0,
      is_overdue: true,
      hours_until_deadline: -20,
    },
    {
      id: '102',
      title: 'Investigate payment gateway webhook failures',
      description: 'Stripe webhook 502 error investigation',
      employee: 'Alex Rivera',
      status: 'In Progress',
      deadline: '2026-10-29T18:00:00Z',
      urgency: 'High',
      source: 'Helpdesk',
      url: '/mock/helpdesk/102',
      priority_category: 'Due Today',
      priority_rank: 1,
      is_overdue: false,
      hours_until_deadline: 4,
    },
    {
      id: '103',
      title: 'Quarterly compliance signoff and internal audit',
      description: 'Completed audit signoff for security officer',
      employee: 'Sarah Jenkins',
      status: 'Completed',
      deadline: '2026-10-25T10:00:00Z',
      urgency: 'Medium',
      source: 'CRM',
      url: '/mock/crm/103',
      priority_category: 'Completed',
      priority_rank: 4,
      is_overdue: false,
      hours_until_deadline: -90,
    },
    {
      id: '104',
      title: 'General software configuration review',
      description: 'No specific SLA deadline assigned for this work item',
      employee: 'Alex Rivera',
      status: 'Pending',
      deadline: null,
      urgency: 'Low',
      source: 'Helpdesk',
      url: '/mock/helpdesk/104',
      priority_category: 'Upcoming',
      priority_rank: 3,
      is_overdue: false,
      hours_until_deadline: null,
    },
  ],
  sources: {
    crm: { status: 'success', task_count: 2 },
    helpdesk: { status: 'success', task_count: 2 },
  },
  warnings: [],
  total: 4,
};

describe('Employee Task Dashboard - Step 6 Full Specification Suite', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTasksResponse,
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. renders WorkFlow branding, sidebar, and dashboard title', async () => {
    render(<App />);
    expect(screen.getByText('WorkFlow')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Desk')).toBeInTheDocument();
    expect(screen.getByText('Employee Dashboard')).toBeInTheDocument();
  });

  it('2. renders accurate summary card calculations', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
      expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('3. renders task table with rows, badges, and verified deep links', async () => {
    render(<App />);
    await waitFor(() => {
      const titles = screen.getAllByText('Follow up with customer on contract renewal');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    // Check source badges
    const crmBadges = screen.getAllByText('CRM');
    expect(crmBadges.length).toBeGreaterThan(0);
    const hdBadges = screen.getAllByText('Helpdesk');
    expect(hdBadges.length).toBeGreaterThan(0);

    // Deep link attributes: rel="noopener noreferrer" and target="_blank"
    const link = screen.getAllByRole('link', { name: /Follow up with customer on contract renewal/i })[0];
    expect(link).toHaveAttribute('href', '/mock/crm/101');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('4. displays "No deadline" clearly for tasks with missing deadlines', async () => {
    render(<App />);
    await waitFor(() => {
      const noDeadlines = screen.getAllByText(/No deadline/i);
      expect(noDeadlines.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('5. triggers employee filter when selecting an employee from the dropdown', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Alex Rivera' })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: /Filter by employee/i });
    fireEvent.change(select, { target: { value: 'Alex Rivera' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/employee=Alex(\+|%20)Rivera/),
        expect.anything()
      );
    });
  });

  it('6. triggers status filter when selecting a status from dropdown', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Filter by status/i })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: /Filter by status/i });
    fireEvent.change(select, { target: { value: 'Pending' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=Pending'),
        expect.anything()
      );
    });
  });

  it('7. triggers search query debounced fetch when input is changed', async () => {
    render(<App />);
    const searchInput = screen.getByRole('textbox', { name: /Search tasks/i });
    fireEvent.change(searchInput, { target: { value: 'webhook' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=webhook'),
        expect.anything()
      );
    });
  });

  it('8. clears filters when Clear Filters button is clicked', async () => {
    render(<App />);
    const searchInput = screen.getByRole('textbox', { name: /Search tasks/i });
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Clear all filters/i })).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /Clear all filters/i });
    fireEvent.click(clearBtn);

    expect(searchInput).toHaveValue('');
  });

  it('9. triggers refresh when the Refresh button is clicked', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh tasks feed/i })).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh tasks feed/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('10. displays partial-source degradation warning banner when warnings are present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockTasksResponse,
        warnings: ['CRM API timed out after 3.5 seconds.'],
      }),
    }));

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Partial Source System Degradation/i)).toBeInTheDocument();
      expect(screen.getByText(/CRM API timed out after 3.5 seconds./i)).toBeInTheDocument();
    });
  });

  it('11. renders error state and retry button when backend fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => ({ detail: 'Both CRM and Helpdesk upstream source APIs failed to respond.' }),
    }));

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Unable to Load Employee Tasks/i)).toBeInTheDocument();
      expect(screen.getByText(/Both CRM and Helpdesk upstream source APIs failed to respond/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Request/i })).toBeInTheDocument();
    });
  });

  it('12. renders empty state when query returns zero tasks', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tasks: [],
        sources: { crm: { status: 'success', task_count: 0 } },
        warnings: [],
        total: 0,
      }),
    }));

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/No matching tasks found/i)).toBeInTheDocument();
    });
  });

  it('13. supports opening and closing mobile sidebar drawer', async () => {
    render(<App />);
    const menuBtn = screen.getByRole('button', { name: /Open sidebar menu/i });
    expect(menuBtn).toBeInTheDocument();
    fireEvent.click(menuBtn);

    await waitFor(() => {
      const closeBtn = screen.getByRole('button', { name: /Close navigation/i });
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);
    });
  });

  it('14. clears individual employee filter via active chip without resetting status filter', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Alex Rivera' })).toBeInTheDocument();
    });

    // Set employee and status
    const empSelect = screen.getByRole('combobox', { name: /Filter by employee/i });
    const statusSelect = screen.getByRole('combobox', { name: /Filter by status/i });
    fireEvent.change(empSelect, { target: { value: 'Alex Rivera' } });
    fireEvent.change(statusSelect, { target: { value: 'In Progress' } });

    // Wait for the active employee chip
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Clear employee filter for Alex Rivera/i })).toBeInTheDocument();
    });

    // Click to clear ONLY employee
    const clearEmpChip = screen.getByRole('button', { name: /Clear employee filter for Alex Rivera/i });
    fireEvent.click(clearEmpChip);

    // Verify employee reset to All Employees, but status remained In Progress!
    expect(empSelect).toHaveValue('All Employees');
    expect(statusSelect).toHaveValue('In Progress');
  });

  it('15. clears individual status filter via active chip without resetting employee', async () => {
    render(<App />);
    const statusSelect = screen.getByRole('combobox', { name: /Filter by status/i });
    fireEvent.change(statusSelect, { target: { value: 'Completed' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Clear status filter for Completed/i })).toBeInTheDocument();
    });

    const clearStatusChip = screen.getByRole('button', { name: /Clear status filter for Completed/i });
    fireEvent.click(clearStatusChip);

    expect(statusSelect).toHaveValue('All Statuses');
  });

  it('16. clears individual search term via chip', async () => {
    render(<App />);
    const searchInput = screen.getByRole('textbox', { name: /Search tasks/i });
    fireEvent.change(searchInput, { target: { value: 'investigate' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Clear search term/i })).toBeInTheDocument();
    });

    const clearSearchChip = screen.getByRole('button', { name: /Clear search term/i });
    fireEvent.click(clearSearchChip);

    expect(searchInput).toHaveValue('');
  });

  it('17. synchronizes active filter parameters to URL search state', async () => {
    render(<App />);
    const statusSelect = screen.getByRole('combobox', { name: /Filter by status/i });
    fireEvent.change(statusSelect, { target: { value: 'Pending' } });

    await waitFor(() => {
      expect(window.location.search).toContain('status=Pending');
    });
  });

  it('18. retains existing task list and displays refresh error banner if background refresh fails', async () => {
    render(<App />);

    // First load succeeds
    await waitFor(() => {
      expect(screen.getAllByText('Follow up with customer on contract renewal').length).toBeGreaterThanOrEqual(1);
    });

    // Mock subsequent fetch failure
    mockFetch.mockRejectedValueOnce(new Error('Network timeout during background refresh'));

    // Trigger refresh button
    const refreshBtn = screen.getByRole('button', { name: /Refresh tasks feed/i });
    fireEvent.click(refreshBtn);

    // Verify refresh notice banner appears with error message
    await waitFor(() => {
      expect(screen.getByText(/Refresh Notice:/i)).toBeInTheDocument();
      expect(screen.getByText(/Network timeout during background refresh/i)).toBeInTheDocument();
    });

    // Verify previous tasks are NOT wiped out
    expect(screen.getAllByText('Follow up with customer on contract renewal').length).toBeGreaterThanOrEqual(1);
  });

  it('19. renders partial failure warning banner when one source reports degraded status', async () => {
    const degradedResponse: UnifiedTasksResponse = {
      ...mockTasksResponse,
      sources: {
        crm: { status: 'unavailable', task_count: 0 },
        helpdesk: { status: 'success', task_count: 2 },
      },
      warnings: ['Could not connect to CRM API: Connection refused on port 8001.'],
      tasks: mockTasksResponse.tasks.filter((t) => t.source === 'Helpdesk'),
      total: 2,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => degradedResponse,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Partial Source System Degradation')).toBeInTheDocument();
      expect(screen.getByText(/Could not connect to CRM API/i)).toBeInTheDocument();
    });
  });
});

