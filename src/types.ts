export type UserRole = 'admin' | 'seller' | 'customer' | 'delivery';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBanned?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  sellerId: string;
  sellerName: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  products: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export type DeliveryStatus = 'Pending' | 'Picked Up' | 'Delivering' | 'Delivered';

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  status: DeliveryStatus;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  roleBreakdown: Record<UserRole, number>;
  monthlyRevenue: { month: string; amount: number }[];
  categorySales: { category: string; count: number; value: number }[];
}

export interface SellerStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  recentOrdersCount: number;
}
