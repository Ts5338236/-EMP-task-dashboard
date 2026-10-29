import { User, LoginResponse, CreateUserInput, UpdateUserInput } from '../types/auth';

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || '';
  if (typeof window !== 'undefined') {
    const isRemote = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isRemote && (configured.includes('localhost') || configured.includes('127.0.0.1'))) {
      return '';
    }
  }
  return configured;
}

const API_BASE = getApiBaseUrl();

function getHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginApi(identifier: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    let errorDetail = `Login failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Keep fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchMeApi(token?: string | null): Promise<User> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'GET',
    headers: getHeaders(token),
    credentials: 'include',
  });

  if (!response.ok) {
    let errorDetail = `Session check failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Keep fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  });
}

export async function fetchAdminUsersApi(token?: string | null): Promise<User[]> {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'GET',
    headers: getHeaders(token),
    credentials: 'include',
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch users (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Keep fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function createAdminUserApi(userIn: CreateUserInput, token?: string | null): Promise<User> {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'POST',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify(userIn),
  });

  if (!response.ok) {
    let errorDetail = `Failed to create user (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Keep fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function updateAdminUserApi(
  userId: string,
  updates: UpdateUserInput,
  token?: string | null
): Promise<User> {
  const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    let errorDetail = `Failed to update user (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Keep fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function deactivateAdminUserApi(userId: string, token?: string | null): Promise<{ detail: string }> {
  const response = await fetch(`${API_BASE}/api/admin/users/${userId}/deactivate`, {
    method: 'POST',
    headers: getHeaders(token),
    credentials: 'include',
  });

  if (!response.ok) {
    let errorDetail = `Failed to deactivate user (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Keep fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
