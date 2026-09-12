export interface CashierCredential {
  id: string;
  mobileNumber: string;
  password: string;
  role: 'CASHIER';
  isActive: boolean;
  cashierName: string;
  employeeId: string;
  storeId: string;
  storeName: string;
  branchName: string;
}

export const MOCK_CASHIER_CREDENTIALS: CashierCredential[] = [
  {
    id: 'cashier-01',
    mobileNumber: '9876543210',
    password: 'pos@123',
    role: 'CASHIER',
    isActive: true,
    cashierName: 'Moazzam Ali',
    employeeId: 'EMP-9821',
    storeId: 'rest-01',
    storeName: 'Sanwariya Cuisine',
    branchName: 'Main Branch - Sector V',
  },
  {
    id: 'cashier-02',
    mobileNumber: '9811122233',
    password: 'cashier123',
    role: 'CASHIER',
    isActive: true,
    cashierName: 'Rahul Sharma',
    employeeId: 'EMP-4412',
    storeId: 'rest-01',
    storeName: 'Sanwariya Cuisine',
    branchName: 'Main Branch - Sector V',
  },
  {
    id: 'cashier-03',
    mobileNumber: '9899988877',
    password: 'deactivated123',
    role: 'CASHIER',
    isActive: false, // Inactive account (test revocation)
    cashierName: 'Suresh Kumar',
    employeeId: 'EMP-1102',
    storeId: 'rest-01',
    storeName: 'Sanwariya Cuisine',
    branchName: 'Main Branch - Sector V',
  },
];
