import { create } from 'zustand';
import { Category, Product } from '@/mock/data';
import { api } from '@/services/authService.mock';

// Icon lookup so backend category strings still render a sensible glyph.
const CATEGORY_ICONS: Record<string, string> = {
  Starters: 'food-croissant',
  'Main Course': 'food',
  'Roti & Naan': 'flatbread',
  Breads: 'flatbread',
  Desserts: 'cake-variant',
  Beverages: 'glass-cocktail',
  'Fast Food': 'food-fork-drink',
};

const iconForCategory = (name: string) => CATEGORY_ICONS[name] || 'silverware-fork-knife';

const mapBackendProduct = (p: any): Product => ({
  id: p._id || p.id,
  categoryId: p.category || 'Uncategorized',
  name: p.name,
  price: p.price || 0,
  description: p.description || '',
  isVeg: p.foodType === 'veg',
  isAvailable: p.isAvailable ?? true,
  image: p.imageUrl || undefined,
});

// Derive the category chips from the distinct categories present in the menu.
const deriveCategories = (products: Product[]): Category[] => {
  const seen = new Map<string, Category>();
  for (const p of products) {
    if (!seen.has(p.categoryId)) {
      seen.set(p.categoryId, { id: p.categoryId, name: p.categoryId, icon: iconForCategory(p.categoryId) });
    }
  }
  return [...seen.values()];
};

interface MenuState {
  categories: Category[];
  products: Product[];
  selectedCategoryId: string; // 'all' or category ID
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
  selectCategory: (categoryId: string) => void;
  setSearchQuery: (query: string) => void;
  getFilteredProducts: () => Product[];
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  products: [],
  selectedCategoryId: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchMenu: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/products', { params: { isAvailable: true } });
      const products = (response.data.data || []).map(mapBackendProduct);
      set({ products, categories: deriveCategories(products), isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load menu', isLoading: false });
    }
  },

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
