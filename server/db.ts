import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = path.join(process.cwd(), 'DB_STORE.json');

// Interface representation for local file storage
interface DBStructure {
  users: any[];
  products: any[];
  orders: any[];
  deliveries: any[];
}

// Initial seed accounts with hashed passwords
const INITIAL_USERS = [
  {
    id: 'u-1',
    name: 'Admin Principal',
    email: 'admin@shop.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    isBanned: false
  },
  {
    id: 'u-2',
    name: 'Cambodian Silk Seller',
    email: 'seller@shop.com',
    password: bcrypt.hashSync('seller123', 10),
    role: 'seller',
    isBanned: false
  },
  {
    id: 'u-3',
    name: 'Chan Sophea',
    email: 'customer@shop.com',
    password: bcrypt.hashSync('customer123', 10),
    role: 'customer',
    isBanned: false
  },
  {
    id: 'u-4',
    name: 'Vannak Delivery',
    email: 'delivery@shop.com',
    password: bcrypt.hashSync('delivery123', 10),
    role: 'delivery',
    isBanned: false
  }
];

const INITIAL_PRODUCTS = [
  {
    id: 'p-1',
    name: 'Premium Cambodian Silk Scarf',
    price: 35.00,
    category: 'Fashion',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=60',
    sellerId: 'u-2',
    sellerName: 'Cambodian Silk Seller'
  },
  {
    id: 'p-2',
    name: 'Organic Jasmine Rice (5kg)',
    price: 12.50,
    category: 'Home & Kitchen',
    stock: 120,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=60',
    sellerId: 'u-2',
    sellerName: 'Cambodian Silk Seller'
  },
  {
    id: 'p-3',
    name: 'Handmade Kampot Pepper Mill',
    price: 18.00,
    category: 'Home & Kitchen',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=60',
    sellerId: 'u-2',
    sellerName: 'Cambodian Silk Seller'
  },
  {
    id: 'p-4',
    name: 'Minimalist Leather Wallet',
    price: 22.00,
    category: 'Fashion',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1627124709773-5a2176c4ca7a?w=600&auto=format&fit=crop&q=60',
    sellerId: 'u-2',
    sellerName: 'Cambodian Silk Seller'
  },
  {
    id: 'p-5',
    name: 'Wireless Ergonomic Keyboard',
    price: 89.99,
    category: 'Electronics',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=60',
    sellerId: 'u-2',
    sellerName: 'Cambodian Silk Seller'
  }
];

const INITIAL_ORDERS = [
  {
    id: 'ORD-101',
    userId: 'u-3',
    customerName: 'Chan Sophea',
    customerPhone: '012345678',
    customerAddress: 'Street 271, Boeung Keng Kang, Phnom Penh',
    products: [
      { id: 'oi-1', productId: 'p-1', name: 'Premium Cambodian Silk Scarf', price: 35.00, qty: 1 },
      { id: 'oi-2', productId: 'p-2', name: 'Organic Jasmine Rice (5kg)', price: 12.50, qty: 2 }
    ],
    total: 60.00,
    status: 'Delivered',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: 'ORD-102',
    userId: 'u-3',
    customerName: 'Chan Sophea',
    customerPhone: '012345678',
    customerAddress: 'Mao Tse Toung Blvd, Chamkar Mon, Phnom Penh',
    products: [
      { id: 'oi-3', productId: 'p-3', name: 'Handmade Kampot Pepper Mill', price: 18.00, qty: 1 }
    ],
    total: 18.00,
    status: 'Processing',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_DELIVERIES = [
  {
    id: 'd-1',
    orderId: 'ORD-101',
    driverId: 'u-4',
    driverName: 'Vannak Delivery',
    status: 'Delivered',
    updatedAt: new Date(Date.now() - 47 * 3600 * 1000).toISOString()
  },
  {
    id: 'd-2',
    orderId: 'ORD-102',
    driverId: 'u-4',
    driverName: 'Vannak Delivery',
    status: 'Pending',
    updatedAt: new Date().toISOString()
  }
];

class Database {
  private data: DBStructure = { users: [], products: [], orders: [], deliveries: [] };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = {
          users: INITIAL_USERS,
          products: INITIAL_PRODUCTS,
          orders: INITIAL_ORDERS,
          deliveries: INITIAL_DELIVERIES
        };
        this.save();
      }
    } catch (error) {
      console.error('Error loading JSON Db, resetting to initial state', error);
      this.data = {
        users: INITIAL_USERS,
        products: INITIAL_PRODUCTS,
        orders: INITIAL_ORDERS,
        deliveries: INITIAL_DELIVERIES
      };
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving DB to file', error);
    }
  }

  // Users Collection
  getUsers() { return this.data.users; }
  getUserById(id: string) { return this.data.users.find(u => u.id === id); }
  getUserByEmail(email: string) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  createUser(user: any) {
    const newUser = { id: `u-${Date.now()}`, isBanned: false, ...user };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }
  updateUser(id: string, updates: any) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }
  deleteUser(id: string) {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Products Collection
  getProducts() { return this.data.products; }
  getProductById(id: string) { return this.data.products.find(p => p.id === id); }
  createProduct(product: any) {
    const newProduct = { id: `p-${Date.now()}`, ...product };
    this.data.products.push(newProduct);
    this.save();
    return newProduct;
  }
  updateProduct(id: string, updates: any) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.products[idx] = { ...this.data.products[idx], ...updates };
      this.save();
      return this.data.products[idx];
    }
    return null;
  }
  deleteProduct(id: string) {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Orders Collection
  getOrders() { return this.data.orders; }
  getOrderById(id: string) { return this.data.orders.find(o => o.id === id); }
  createOrder(order: any) {
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      ...order
    };
    this.data.orders.push(newOrder);
    
    // Create an automatic Delivery entity for driver assign capability
    const newDelivery = {
      id: `d-${Date.now()}`,
      orderId: newOrder.id,
      driverId: '',
      driverName: 'Not Assigned',
      status: 'Pending',
      updatedAt: new Date().toISOString()
    };
    this.data.deliveries.push(newDelivery);

    this.save();
    return newOrder;
  }
  updateOrder(id: string, updates: any) {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
      
      // Keep Delivery object sync if order is cancelled
      if (updates.status === 'Cancelled') {
        const delIdx = this.data.deliveries.findIndex(d => d.orderId === id);
        if (delIdx !== -1) {
          this.data.deliveries[delIdx].status = 'Pending';
          this.data.deliveries[delIdx].updatedAt = new Date().toISOString();
        }
      }
      
      this.save();
      return this.data.orders[idx];
    }
    return null;
  }
  deleteOrder(id: string) {
    const initialLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter(o => o.id !== id);
    this.data.deliveries = this.data.deliveries.filter(d => d.orderId !== id);
    if (this.data.orders.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Deliveries Collection
  getDeliveries() { return this.data.deliveries; }
  getDeliveryByOrderId(orderId: string) { return this.data.deliveries.find(d => d.orderId === orderId); }
  updateDelivery(orderId: string, updates: any) {
    const idx = this.data.deliveries.findIndex(d => d.orderId === orderId);
    if (idx !== -1) {
      this.data.deliveries[idx] = { ...this.data.deliveries[idx], ...updates, updatedAt: new Date().toISOString() };
      
      // Update linked order status depending on delivery status triggers
      const orderIdx = this.data.orders.findIndex(o => o.id === orderId);
      if (orderIdx !== -1) {
        let orderStatus = this.data.orders[orderIdx].status;
        const status = updates.status;
        if (status === 'Pending') orderStatus = 'Processing';
        else if (status === 'Picked Up') orderStatus = 'Processing';
        else if (status === 'Delivering') orderStatus = 'Shipped';
        else if (status === 'Delivered') orderStatus = 'Delivered';
        this.data.orders[orderIdx].status = orderStatus;
      }
      
      this.save();
      return this.data.deliveries[idx];
    }
    return null;
  }
}

export const db = new Database();
