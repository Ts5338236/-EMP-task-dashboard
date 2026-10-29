export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  employee_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  employee_name?: string;
}

export interface UpdateUserInput {
  role?: UserRole;
  employee_name?: string;
  is_active?: boolean;
  password?: string;
}

