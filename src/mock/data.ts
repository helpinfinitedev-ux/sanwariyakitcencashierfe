export interface Restaurant {
  id: string;
  name: string;
  branch: string;
  address: string;
  phone: string;
  gstNumber: string;
}

export interface Floor {
  id: string;
  name: string;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billing' | 'cleaning';

export interface Table {
  id: string;
  name: string;
  floorId: string;
  status: TableStatus;
  capacity: number;
  currentOrderId?: string;
  waiterId?: string;
  // Positioning coordinates for visual interactive floor layout (15" to 22" screens)
  x: number;
  y: number;
}

export interface Waiter {
  id: string;
  name: string;
  code: string;
  phone: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Icon name from MaterialCommunityIcons
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description: string;
  isVeg: boolean;
  isAvailable: boolean;
  image?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'billing' | 'completed' | 'cancelled' | 'accepted' | 'rejected';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface OrderItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string;
  tableName?: string;
  floorName?: string;
  waiterId?: string;
  waiterName?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  discount: number;
  total: number;
  status: OrderStatus;
  type: OrderType;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'split';
  createdAt: string;
  rejectionReason?: string;
  numberOfGuests?: number;
}

// ----------------------------------------------------
// MOCK DATA IMPLEMENTATION
// ----------------------------------------------------

export const MOCK_RESTAURANT: Restaurant = {
  id: 'rest-01',
  name: 'Sanwariya Kitchen',
  branch: 'Main Branch - Sector V',
  address: 'Salt Lake Sector V, Kolkata, West Bengal',
  phone: '+91 98765 43210',
  gstNumber: '19AAACS2341M1ZN',
};

export const MOCK_FLOORS: Floor[] = [
  { id: 'floor-g', name: 'Ground Floor' },
  { id: 'floor-1', name: 'First Floor (AC)' },
  { id: 'floor-rooftop', name: 'Rooftop Lounge' },
];

export const MOCK_WAITERS: Waiter[] = [
  { id: 'w-01', name: 'Rahul Sharma', code: '101', phone: '+91 99111 22233' },
  { id: 'w-02', name: 'Amit Verma', code: '102', phone: '+91 99111 22244' },
  { id: 'w-03', name: 'Rohan Gupta', code: '103', phone: '+91 99111 22255' },
  { id: 'w-04', name: 'Vikram Singh', code: '104', phone: '+91 99111 22266' },
  { id: 'w-05', name: 'Sanjay Kumar', code: '105', phone: '+91 99111 22277' },
];

export const MOCK_TABLES: Table[] = [
  // Ground Floor Tables (Grid position x, y in percents)
  {
    id: 't-g1',
    name: 'Table 1',
    floorId: 'floor-g',
    status: 'available',
    capacity: 2,
    x: 10,
    y: 15,
  },
  {
    id: 't-g2',
    name: 'Table 2',
    floorId: 'floor-g',
    status: 'occupied',
    capacity: 4,
    currentOrderId: 'ord-101',
    waiterId: 'w-01',
    x: 30,
    y: 15,
  },
  {
    id: 't-g3',
    name: 'Table 3',
    floorId: 'floor-g',
    status: 'reserved',
    capacity: 4,
    x: 50,
    y: 15,
  },
  {
    id: 't-g4',
    name: 'Table 4',
    floorId: 'floor-g',
    status: 'available',
    capacity: 6,
    x: 70,
    y: 15,
  },
  {
    id: 't-g5',
    name: 'Table 5',
    floorId: 'floor-g',
    status: 'billing',
    capacity: 2,
    currentOrderId: 'ord-102',
    waiterId: 'w-02',
    x: 10,
    y: 55,
  },
  {
    id: 't-g6',
    name: 'Table 6',
    floorId: 'floor-g',
    status: 'cleaning',
    capacity: 4,
    x: 30,
    y: 55,
  },
  {
    id: 't-g7',
    name: 'Table 7',
    floorId: 'floor-g',
    status: 'available',
    capacity: 4,
    x: 50,
    y: 55,
  },
  {
    id: 't-g8',
    name: 'Table 8',
    floorId: 'floor-g',
    status: 'occupied',
    capacity: 8,
    currentOrderId: 'ord-103',
    waiterId: 'w-03',
    x: 70,
    y: 55,
  },

  // First Floor Tables
  {
    id: 't-f1',
    name: 'Table A1',
    floorId: 'floor-1',
    status: 'available',
    capacity: 2,
    x: 15,
    y: 20,
  },
  {
    id: 't-f2',
    name: 'Table A2',
    floorId: 'floor-1',
    status: 'occupied',
    capacity: 4,
    currentOrderId: 'ord-104',
    waiterId: 'w-04',
    x: 45,
    y: 20,
  },
  {
    id: 't-f3',
    name: 'Table A3',
    floorId: 'floor-1',
    status: 'available',
    capacity: 6,
    x: 75,
    y: 20,
  },
  {
    id: 't-f4',
    name: 'Table B1',
    floorId: 'floor-1',
    status: 'available',
    capacity: 4,
    x: 15,
    y: 60,
  },
  {
    id: 't-f5',
    name: 'Table B2',
    floorId: 'floor-1',
    status: 'reserved',
    capacity: 4,
    x: 45,
    y: 60,
  },
  {
    id: 't-f6',
    name: 'Table B3',
    floorId: 'floor-1',
    status: 'occupied',
    capacity: 8,
    currentOrderId: 'ord-105',
    waiterId: 'w-01',
    x: 75,
    y: 60,
  },

  // Rooftop Tables
  {
    id: 't-r1',
    name: 'Roof T1',
    floorId: 'floor-rooftop',
    status: 'available',
    capacity: 4,
    x: 20,
    y: 20,
  },
  {
    id: 't-r2',
    name: 'Roof T2',
    floorId: 'floor-rooftop',
    status: 'occupied',
    capacity: 4,
    currentOrderId: 'ord-106',
    waiterId: 'w-05',
    x: 50,
    y: 20,
  },
  {
    id: 't-r3',
    name: 'Roof T3',
    floorId: 'floor-rooftop',
    status: 'available',
    capacity: 4,
    x: 80,
    y: 20,
  },
  {
    id: 't-r4',
    name: 'Roof Lounge 1',
    floorId: 'floor-rooftop',
    status: 'available',
    capacity: 8,
    x: 35,
    y: 60,
  },
  {
    id: 't-r5',
    name: 'Roof Lounge 2',
    floorId: 'floor-rooftop',
    status: 'available',
    capacity: 8,
    x: 65,
    y: 60,
  },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-starters', name: 'Starters', icon: 'food-croissant' },
  { id: 'cat-mains', name: 'Main Course', icon: 'food' },
  { id: 'cat-breads', name: 'Roti & Naan', icon: 'flatbread' },
  { id: 'cat-desserts', name: 'Desserts', icon: 'cake-variant' },
  { id: 'cat-beverages', name: 'Beverages', icon: 'glass-cocktail' },
  { id: 'cat-fastfood', name: 'Fast Food', icon: 'fast-food' },
];

export const MOCK_PRODUCTS: Product[] = [
  // Starters
  {
    id: 'p-01',
    categoryId: 'cat-starters',
    name: 'Paneer Tikka',
    price: 280,
    description: 'Succulent cubes of paneer marinated in spiced yogurt and grilled in a tandoor.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-02',
    categoryId: 'cat-starters',
    name: 'Hara Bhara Kabab',
    price: 220,
    description: 'Deep fried patties made of spinach, peas, and potatoes seasoned with spices.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-03',
    categoryId: 'cat-starters',
    name: 'Crispy Chilli Baby Corn',
    price: 240,
    description: 'Stir fried baby corn tossed in a spicy, tangy sweet chilli sauce.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-04',
    categoryId: 'cat-starters',
    name: 'Veg Spring Roll',
    price: 180,
    description: 'Crispy wrappers filled with stir fried vegetables served with sweet chilli dip.',
    isVeg: true,
    isAvailable: true,
  },

  // Main Course
  {
    id: 'p-05',
    categoryId: 'cat-mains',
    name: 'Paneer Butter Masala',
    price: 340,
    description: 'Rich and creamy curry made with cottage cheese cubes in a tomato-butter gravy.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-06',
    categoryId: 'cat-mains',
    name: 'Dal Makhani',
    price: 290,
    description: 'Black lentils slow cooked overnight with butter, cream, and traditional spices.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-07',
    categoryId: 'cat-mains',
    name: 'Mix Veg Kadai',
    price: 280,
    description: 'Assorted seasonal vegetables tossed in a spicy kadai masala and thick gravy.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-08',
    categoryId: 'cat-mains',
    name: 'Veg Biryani',
    price: 310,
    description:
      'Fragrant basmati rice layered with spiced vegetables, saffron, and cooked on dum.',
    isVeg: true,
    isAvailable: true,
  },

  // Breads
  {
    id: 'p-09',
    categoryId: 'cat-breads',
    name: 'Butter Tandoori Roti',
    price: 40,
    description: 'Whole wheat flatbread cooked in tandoor and brushed with fresh butter.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-10',
    categoryId: 'cat-breads',
    name: 'Butter Naan',
    price: 65,
    description: 'Soft and leavened refined flour bread cooked in tandoor topped with butter.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-11',
    categoryId: 'cat-breads',
    name: 'Garlic Naan',
    price: 80,
    description:
      'Tandoori naan infused with minced garlic and coriander leaves, brushed with butter.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-12',
    categoryId: 'cat-breads',
    name: 'Lachha Paratha',
    price: 70,
    description: 'Layered whole wheat flatbread baked in a tandoor.',
    isVeg: true,
    isAvailable: true,
  },

  // Desserts
  {
    id: 'p-13',
    categoryId: 'cat-desserts',
    name: 'Gulab Jamun (2 Pcs)',
    price: 90,
    description:
      'Deep fried berry-sized balls made of milk solids, soaked in hot saffron sugar syrup.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-14',
    categoryId: 'cat-desserts',
    name: 'Sizzling Brownie with Ice Cream',
    price: 210,
    description:
      'Warm fudge brownie served on a hot sizzler plate topped with vanilla ice cream and hot chocolate fudge.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-15',
    categoryId: 'cat-desserts',
    name: 'Kesaria Rasmalai (2 Pcs)',
    price: 120,
    description:
      'Flattened balls of chhena soaked in sweetened, thickened milk flavored with saffron and cardamom.',
    isVeg: true,
    isAvailable: true,
  },

  // Beverages
  {
    id: 'p-16',
    categoryId: 'cat-beverages',
    name: 'Masala Shikanji',
    price: 90,
    description: 'Traditional lemonade with roasted cumin, black salt, and fresh mint.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-17',
    categoryId: 'cat-beverages',
    name: 'Virgin Mojito',
    price: 140,
    description: 'Refreshing cooler made of lime juice, sugar syrup, mint leaves, and club soda.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-18',
    categoryId: 'cat-beverages',
    name: 'Iced Peach Tea',
    price: 110,
    description: 'Chilled brewed tea flavored with sweet peach syrup.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-19',
    categoryId: 'cat-beverages',
    name: 'Sweet Lassi',
    price: 100,
    description: 'Thick, creamy yogurt drink blended with sugar and cardamom, topped with malai.',
    isVeg: true,
    isAvailable: true,
  },

  // Fast Food
  {
    id: 'p-20',
    categoryId: 'cat-fastfood',
    name: 'Cheese Burst Pizza (10")',
    price: 380,
    description:
      'Hand-tossed pizza loaded with liquid cheese inside the crust and fresh veggies on top.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-21',
    categoryId: 'cat-fastfood',
    name: 'Double Cheese Margherita Pizza',
    price: 310,
    description:
      'Classic pizza with rich marinara sauce, loaded with fresh mozzarella and basil leaves.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-22',
    categoryId: 'cat-fastfood',
    name: 'Crispy Veg Burger',
    price: 140,
    description:
      'Deep-fried mixed vegetable patty with lettuce, tomatoes, cheese slice and mayonnaise.',
    isVeg: true,
    isAvailable: true,
  },
  {
    id: 'p-23',
    categoryId: 'cat-fastfood',
    name: 'Paneer Tikka Wrap',
    price: 180,
    description:
      'Tortilla rolled with spicy tandoori paneer tikka, sliced onions, and mint chutney.',
    isVeg: true,
    isAvailable: true,
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c-01',
    name: 'Moazzam Ali',
    phone: '9876543210',
    email: 'moazzam@example.com',
    points: 420,
  },
  {
    id: 'c-02',
    name: 'Rahul Sen',
    phone: '9830012345',
    email: 'rahul.sen@example.com',
    points: 150,
  },
  { id: 'c-03', name: 'Sneha Roy', phone: '9836098765', email: 'sneha@example.com', points: 80 },
  { id: 'c-04', name: 'Priyan Ghosh', phone: '9007011223', points: 300 },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'SK-1001',
    tableId: 't-g2',
    tableName: 'Table 2',
    floorName: 'Ground Floor',
    waiterId: 'w-01',
    waiterName: 'Rahul Sharma',
    customerId: 'c-01',
    customerName: 'Moazzam Ali',
    items: [
      { product: MOCK_PRODUCTS[0], quantity: 2, notes: 'Extra spicy' }, // Paneer Tikka
      { product: MOCK_PRODUCTS[4], quantity: 1 }, // Paneer Butter Masala
      { product: MOCK_PRODUCTS[9], quantity: 4 }, // Butter Naan
    ],
    subtotal: 1160,
    gst: 208.8,
    discount: 100,
    total: 1268.8,
    status: 'preparing',
    type: 'dine-in',
    createdAt: '2026-07-10T08:30:00Z',
  },
  {
    id: 'ord-102',
    orderNumber: 'SK-1002',
    tableId: 't-g5',
    tableName: 'Table 5',
    floorName: 'Ground Floor',
    waiterId: 'w-02',
    waiterName: 'Amit Verma',
    items: [
      { product: MOCK_PRODUCTS[20], quantity: 1 }, // Margherita Pizza
      { product: MOCK_PRODUCTS[16], quantity: 2 }, // Virgin Mojito
    ],
    subtotal: 590,
    gst: 106.2,
    discount: 0,
    total: 696.2,
    status: 'billing',
    type: 'dine-in',
    createdAt: '2026-07-10T08:50:00Z',
  },
  {
    id: 'ord-103',
    orderNumber: 'SK-1003',
    tableId: 't-g8',
    tableName: 'Table 8',
    floorName: 'Ground Floor',
    waiterId: 'w-03',
    waiterName: 'Rohan Gupta',
    items: [
      { product: MOCK_PRODUCTS[1], quantity: 1 }, // Hara Bhara Kabab
      { product: MOCK_PRODUCTS[5], quantity: 2 }, // Dal Makhani
      { product: MOCK_PRODUCTS[10], quantity: 6 }, // Garlic Naan
      { product: MOCK_PRODUCTS[18], quantity: 3 }, // Sweet Lassi
    ],
    subtotal: 1580,
    gst: 284.4,
    discount: 150,
    total: 1714.4,
    status: 'preparing',
    type: 'dine-in',
    createdAt: '2026-07-10T09:10:00Z',
  },
  {
    id: 'ord-104',
    orderNumber: 'SK-1004',
    tableId: 't-f2',
    tableName: 'Table A2',
    floorName: 'First Floor (AC)',
    waiterId: 'w-04',
    waiterName: 'Vikram Singh',
    items: [
      { product: MOCK_PRODUCTS[22], quantity: 2 }, // Paneer Tikka Wrap
    ],
    subtotal: 360,
    gst: 64.8,
    discount: 0,
    total: 424.8,
    status: 'pending',
    type: 'dine-in',
    createdAt: '2026-07-10T09:20:00Z',
  },
];

export interface ReportData {
  salesToday: number;
  ordersTodayCount: number;
  activeTablesCount: number;
  dineInSales: number;
  takeawaySales: number;
  deliverySales: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  categorySales: { categoryName: string; amount: number }[];
  popularProducts: { name: string; quantity: number; amount: number }[];
}

export const MOCK_REPORT: ReportData = {
  salesToday: 42560,
  ordersTodayCount: 54,
  activeTablesCount: 5,
  dineInSales: 28450,
  takeawaySales: 8900,
  deliverySales: 5210,
  cashSales: 15200,
  upiSales: 21360,
  cardSales: 6000,
  categorySales: [
    { categoryName: 'Main Course', amount: 18500 },
    { categoryName: 'Starters', amount: 11200 },
    { categoryName: 'Fast Food', amount: 6400 },
    { categoryName: 'Beverages', amount: 3860 },
    { categoryName: 'Breads', amount: 2600 },
  ],
  popularProducts: [
    { name: 'Paneer Butter Masala', quantity: 18, amount: 6120 },
    { name: 'Dal Makhani', quantity: 15, amount: 4350 },
    { name: 'Paneer Tikka', quantity: 12, amount: 3360 },
    { name: 'Cheese Burst Pizza', quantity: 8, amount: 3040 },
    { name: 'Virgin Mojito', quantity: 20, amount: 2800 },
  ],
};
