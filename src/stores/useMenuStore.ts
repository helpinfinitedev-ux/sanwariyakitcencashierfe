import { create } from 'zustand';
import { Category, Product, MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/mock/data';

interface MenuState {
  categories: Category[];
  products: Product[];
  selectedCategoryId: string; // 'all' or category ID
  searchQuery: string;
  selectCategory: (categoryId: string) => void;
  setSearchQuery: (query: string) => void;
  getFilteredProducts: () => Product[];
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: MOCK_CATEGORIES,
  products: MOCK_PRODUCTS,
  selectedCategoryId: 'all',
  searchQuery: '',
  selectCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  getFilteredProducts: () => {
    const { products, selectedCategoryId, searchQuery } = get();
    return products.filter((prod) => {
      const matchesCategory =
        selectedCategoryId === 'all' || prod.categoryId === selectedCategoryId;
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && prod.isAvailable;
    });
  },
}));
