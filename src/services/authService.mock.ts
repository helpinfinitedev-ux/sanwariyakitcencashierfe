import { MOCK_CASHIER_CREDENTIALS, CashierCredential } from '@/mock/credentials';
import { mockDelay } from '@/utils/formatters';

export interface AuthUser {
  id: string;
  cashierName: string;
  name: string; // compatibility alias
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

/**
 * Sanitizes input phone number to 10 standard digits
 */
export const sanitizeMobile = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  return digits.slice(-10);
};

/**
 * Mock authentication service contract matching KDS and Store Manager ERP backends.
 */
export const authService = {
  /**
   * Validates cashier credentials against the external admin managed credential store.
   */
  login: async (mobileNumber: string, password: string): Promise<AuthResponse> => {
    // Simulate network delay (300 - 500ms)
    await mockDelay(400);

    const cleanMobile = sanitizeMobile(mobileNumber);

    if (!cleanMobile || cleanMobile.length < 10) {
      return {
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Please enter a valid 10-digit mobile number.',
      };
    }

    if (!password || password.trim().length === 0) {
      return {
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Password cannot be empty.',
      };
    }

    // Lookup matching account in credential store
    const matchedAccount = MOCK_CASHIER_CREDENTIALS.find(
      (c) => sanitizeMobile(c.mobileNumber) === cleanMobile,
    );

    // Rule 1: No match or wrong password -> Generic invalid message
    if (!matchedAccount || matchedAccount.password !== password) {
      return {
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        message: 'Invalid mobile number or password.',
      };
    }

    // Rule 2: Account exists but deactivated by Super Admin -> Access Revoked message
    if (!matchedAccount.isActive) {
      return {
        success: false,
        errorCode: 'ACCESS_REVOKED',
        message: 'Access revoked. Contact your admin.',
      };
    }

    // Rule 3: Valid active cashier -> Generate mock session token
    const token = `mock-pos-jwt-${matchedAccount.id}-${Date.now()}`;
    const user: AuthUser = {
      id: matchedAccount.id,
      cashierName: matchedAccount.cashierName,
      name: matchedAccount.cashierName,
      mobileNumber: matchedAccount.mobileNumber,
      employeeId: matchedAccount.employeeId,
      role: 'CASHIER',
      storeId: matchedAccount.storeId,
      storeName: matchedAccount.storeName,
      branchName: matchedAccount.branchName,
      isActive: true,
    };

    return {
      success: true,
      token,
      user,
    };
  },

  /**
   * Re-validates active status on app startup to enforce immediate deactivation.
   */
  validateStoredSession: async (userId: string): Promise<AuthUser | null> => {
    await mockDelay(200);

    const credential = MOCK_CASHIER_CREDENTIALS.find((c) => c.id === userId);

    if (!credential || !credential.isActive) {
      return null;
    }

    return {
      id: credential.id,
      cashierName: credential.cashierName,
      name: credential.cashierName,
      mobileNumber: credential.mobileNumber,
      employeeId: credential.employeeId,
      role: 'CASHIER',
      storeId: credential.storeId,
      storeName: credential.storeName,
      branchName: credential.branchName,
      isActive: true,
    };
  },
};
