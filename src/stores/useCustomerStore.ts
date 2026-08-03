import { create } from 'zustand';
import { Customer, MOCK_CUSTOMERS } from '@/mock/data';

interface CustomerState {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'points'> & { points?: number }) => void;
  findCustomerByPhone: (phone: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: MOCK_CUSTOMERS,
  addCustomer: (newCustomer) =>
    set((state) => {
      // Check if phone number already exists
      const exists = state.customers.some((c) => c.phone === newCustomer.phone);
      if (exists) return {}; // Do nothing or handle error in UI

      const customer: Customer = {
        ...newCustomer,
        points: newCustomer.points ?? 0,
      };

      return {
        customers: [...state.customers, customer],
      };
    }),
  findCustomerByPhone: (phone) => {
    const { customers } = get();
    return customers.find((c) => c.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, ''));
  },
}));
