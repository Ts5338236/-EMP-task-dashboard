import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import { UnifiedTasksResponse } from './types/task';

const e2eMockDataset: UnifiedTasksResponse = {
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
      title: 'Internal IT ticket for network switch upgrade',
      description: 'Upgrade rack 4 network switches and patch cables',
      employee: 'Alex Rivera',
      status: 'In Progress',
      deadline: '2026-10-30T16:00:00Z',
      urgency: 'Low',
      source: 'Helpdesk',
      url: '/mock/helpdesk/104',
      priority_category: 'Due Soon',
      priority_rank: 2,
      is_overdue: false,
      hours_until_deadline: 26,
    },
  ],
  sources: {
    crm: { status: 'success', task_count: 2 },
    helpdesk: { status: 'success', task_count: 2 },
  },
  warnings: [],
  total: 4,
};

describe('End-to-End User Journey Suite (Step 9 Acceptance Verification)', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    mockFetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = url.toString();

      // Check simulated total failure
      if (urlStr.includes('simulate_crm_error=true') && urlStr.includes('simulate_helpdesk_error=true')) {
        return Promise.resolve({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          json: async () => ({ detail: 'Both upstream sources failed' }),
        });
      }

      // Filter simulation
      let filtered = [...e2eMockDataset.tasks];

      if (urlStr.includes('employee=')) {
        const empMatch = urlStr.match(/employee=([^&]+)/);
        if (empMatch && empMatch[1] && empMatch[1] !== 'All+Employees' && empMatch[1] !== 'All Employees') {
          const decodedEmp = decodeURIComponent(empMatch[1].replace(/\+/g, ' '));
          filtered = filtered.filter((t) => t.employee.toLowerCase() === decodedEmp.toLowerCase());
        }
      }

      if (urlStr.includes('status=')) {
        const statusMatch = urlStr.match(/status=([^&]+)/);
        if (statusMatch && statusMatch[1] && statusMatch[1] !== 'All+Statuses' && statusMatch[1] !== 'All Statuses') {
          const decodedStatus = decodeURIComponent(statusMatch[1].replace(/\+/g, ' '));
          filtered = filtered.filter((t) => t.status.toLowerCase() === decodedStatus.toLowerCase());
        }
      }

      if (urlStr.includes('search=')) {
        const searchMatch = urlStr.match(/search=([^&]+)/);
        if (searchMatch && searchMatch[1]) {
          const q = decodeURIComponent(searchMatch[1].replace(/\+/g, ' ')).toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.id.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.employee.toLowerCase().includes(q) ||
              t.source.toLowerCase().includes(q)
          );
        }
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          ...e2eMockDataset,
          tasks: filtered,
          total: filtered.length,
        }),
      });
    });

    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  it('completes the complete 12-step end-to-end user journey flawlessly', async () => {
    // 1. Open the dashboard
    render(<App />);

    // 2. Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Employee Dashboard')).toBeInTheDocument();
      expect(screen.getAllByText('Follow up with customer on contract renewal').length).toBeGreaterThanOrEqual(1);
    });

    // 3. Verify that CRM and Helpdesk tasks are visible
    expect(screen.getAllByText('CRM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Helpdesk').length).toBeGreaterThanOrEqual(1);

    // Wait for employee options to load in select
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Alex Rivera' })).toBeInTheDocument();
    });

    // 4. Select an employee (Alex Rivera)
    const empSelect = screen.getByRole('combobox', { name: /Filter by employee/i });
    fireEvent.change(empSelect, { target: { value: 'Alex Rivera' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/employee=Alex(\+|%20)Rivera/),
        expect.anything()
      );
    });

    await waitFor(() => {
      // Alex Rivera tasks visible
      expect(screen.getAllByText('Investigate payment gateway webhook failures').length).toBeGreaterThanOrEqual(1);
      // Tushar Gupta task filtered out
      expect(screen.queryByText('Follow up with customer on contract renewal')).toBeNull();
    });

    // 5. Select a status (In Progress)
    const statusSelect = screen.getByRole('combobox', { name: /Filter by status/i });
    fireEvent.change(statusSelect, { target: { value: 'In Progress' } });

    await waitFor(() => {
      expect(screen.getAllByText('Investigate payment gateway webhook failures').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Internal IT ticket for network switch upgrade').length).toBeGreaterThanOrEqual(1);
    });

    // 6. Search for a specific task ("webhook")
    const searchInput = screen.getByRole('textbox', { name: /Search tasks/i });
    fireEvent.change(searchInput, { target: { value: 'webhook' } });

    // 7. Verify combined filters
    await waitFor(() => {
      expect(screen.getAllByText('Investigate payment gateway webhook failures').length).toBeGreaterThanOrEqual(1);
      // Network switch upgrade filtered out by search term
      expect(screen.queryByText('Internal IT ticket for network switch upgrade')).not.toBeInTheDocument();
    });

    // 8. Clear filters
    const clearAllBtn = screen.getByRole('button', { name: /Clear all filters/i });
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      // All tasks restored
      expect(screen.getAllByText('Follow up with customer on contract renewal').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Investigate payment gateway webhook failures').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Quarterly compliance signoff and internal audit').length).toBeGreaterThanOrEqual(1);
      expect(empSelect).toHaveValue('All Employees');
      expect(statusSelect).toHaveValue('All Statuses');
      expect(searchInput).toHaveValue('');
    });

    // 9. Refresh tasks
    const refreshBtn = screen.getByRole('button', { name: /Refresh tasks feed/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      expect(screen.getAllByText('Follow up with customer on contract renewal').length).toBeGreaterThanOrEqual(1);
    });

    // 10. Open a task source link
    const taskLinks = screen.getAllByRole('link');
    const firstDetailLink = taskLinks.find((l) => l.getAttribute('href')?.startsWith('/mock/crm/101'));
    expect(firstDetailLink).toBeDefined();
    expect(firstDetailLink).toHaveAttribute('target', '_blank');
    expect(firstDetailLink).toHaveAttribute('rel', 'noopener noreferrer');

    // 11. Simulate an API failure and 12. Verify the error and retry experience
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => ({ detail: 'Both CRM and Helpdesk upstream source APIs failed to respond.' }),
    });

    // Trigger failure by changing filter which causes a reload
    fireEvent.change(empSelect, { target: { value: 'Sarah Jenkins' } });

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Employee Tasks')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Request/i })).toBeInTheDocument();
    });

    // Successful retry
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => e2eMockDataset,
    });

    const retryBtn = screen.getByRole('button', { name: /Retry Request/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Employee Dashboard')).toBeInTheDocument();
      expect(screen.getAllByText('Follow up with customer on contract renewal').length).toBeGreaterThanOrEqual(1);
    });
  });
});
