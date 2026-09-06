import axios from 'axios';
import { storage } from './storage';

export interface AuthUser {
  id: string;
  cashierName: string;
  name: string;
  mobileNumber: string;
  employeeId: string;
  role: 'CASHIER';
  storeId: string;
  storeName: string;
  branchName: string;
  isActive: boolean;
}

export interface AuthSuccessResponse {
  success: true;
  token: string;
  user: AuthUser;
}

export interface AuthErrorResponse {
  success: false;
  errorCode: 'INVALID_CREDENTIALS' | 'ACCESS_REVOKED' | 'INVALID_ROLE' | 'SERVER_ERROR';
  message: string;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

const STORAGE_SESSION_KEY = 'sanwariya_pos_cashier_session';

const getStoredToken = (): string | null => {
  try {
    const raw = storage.getItem(STORAGE_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.token || null;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
};

// API Base URL config supplied by Vite at build time.
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_PUBLIC_API_URL;
  if (!envUrl || envUrl === 'mock_api_url') {
    return 'http://localhost:4000/api';
  }
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
};

export const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const mapBackendUserToAuthUser = (user: any): AuthUser => ({
  id: user.id || user._id,
  cashierName: user.name,
  name: user.name,
  mobileNumber: user.phoneNumber,
  employeeId: user.id || user._id,
  role: 'CASHIER',
  storeId: 'store-1',
  storeName: 'Sanwariya Kitchen',
  branchName: 'Main Branch - Sector V',
  isActive: user.isActive ?? true,
});

export const authService = {
  login: async (mobileNumber: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', {
        phoneNumber: mobileNumber,
        password,
      });

      const { token, user } = response.data.data;

      if (user.role !== 'cashier' && user.role !== 'admin') {
        return {
          success: false,
          errorCode: 'INVALID_ROLE',
          message: 'Access Denied: Only Cashiers can login to POS.',
        };
      }

      return {
        success: true,
        token,
        user: mapBackendUserToAuthUser(user),
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials or server error.';
      return {
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message,
      };
    }
  },

  validateStoredSession: async (userId: string): Promise<AuthUser | null> => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data;
      if (!user || !user.isActive) return null;
      return mapBackendUserToAuthUser(user);
    } catch {
      return null;
    }
  },
};
