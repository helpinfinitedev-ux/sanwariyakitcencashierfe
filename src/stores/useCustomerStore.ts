import { create } from 'zustand';
import { Customer } from '@/mock/data';
import { api } from '@/services/authService.mock';

const mapBackendCustomer = (c: any): Customer => ({
  id: c._id || c.id,
  name: c.name,
  phone: c.phoneNumber || '',
  // Backend has no loyalty programme yet; surface visit count as a proxy.
  points: c.visitCount || 0,
});

interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'points'> & { points?: number }) => Promise<void>;
  findCustomerByPhone: (phone: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  isLoading: false,

  fetchCustomers: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/customers');
      set({ customers: (response.data.data || []).map(mapBackendCustomer), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addCustomer: async (newCustomer) => {
    // De-dupe against what we already have.
    if (get().customers.some((c) => c.phone === newCustomer.phone)) return;
    try {
      const response = await api.post('/customers', {
        name: newCustomer.name,
        phoneNumber: newCustomer.phone,
      });
      const created = mapBackendCustomer(response.data.data);
      set((state) => ({ customers: [...state.customers, created] }));
    } catch {
      // Non-fatal — billing can still proceed without a saved profile.
    }
  },

  findCustomerByPhone: (phone) => {
    const { customers } = get();
    return customers.find((c) => c.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, ''));
  },
}));
