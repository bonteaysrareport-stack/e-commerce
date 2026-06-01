import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-khmer-shop-key-2026';

// Create uploads directory if not exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer photo upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Parsing utility middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product pictures statically
app.use('/uploads', express.static(uploadsDir));

// JWT Verification Middleware
function verifyToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Auth token is missing' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired credentials' });
    }
    
    // Check if account has been banned
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User does not exist' });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: 'This user account is banned from accessing services' });
    }

    req.user = decoded;
    next();
  });
}

// Role-based Access Controller factory
function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role permissions' });
    }
    next();
  };
}


// --- 1. AUTHENTICATION SERVICE ---

// User Registration
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All registration credentials are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email account is already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = db.createUser({
    name,
    email,
    password: hashedPassword,
    role
  });

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// User Login Check
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password fields are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email address or password' });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: 'This user account is currently banned' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email address or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Current Authenticated Session Details
app.get('/api/auth/me', verifyToken, (req: any, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User profiles could not be found' });
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});


// --- 2. USERS ADMINISTRATION (Admin Role Exclusive) ---

// Fetch Users List
app.get('/api/users', verifyToken, requireRole(['admin']), (req, res) => {
  const users = db.getUsers().map(({ password, ...u }) => u);
  res.json(users);
});

// Create User
app.post('/api/users', verifyToken, requireRole(['admin']), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password and role are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'Email has already been taken' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const newUser = db.createUser({
    name,
    email,
    password: hashed,
    role
  });

  const { password: _, ...cleanUser } = newUser;
  res.status(201).json(cleanUser);
});

// Edit/Block User Info
app.put('/api/users/:id', verifyToken, requireRole(['admin']), (req, res) => {
  const updates: any = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.role !== undefined) updates.role = req.body.role;
  if (req.body.isBanned !== undefined) updates.isBanned = req.body.isBanned;
  if (req.body.password) {
    updates.password = bcrypt.hashSync(req.body.password, 10);
  }

  const updated = db.updateUser(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'User to update was not found' });
  }

  const { password: _, ...cleanUser } = updated;
  res.json(cleanUser);
});

// Remove User Entity
app.delete('/api/users/:id', verifyToken, requireRole(['admin']), (req: any, res: any) => {
  // Prevent admin from deleting self
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'Self-deletion of administrator account is restricted' });
  }

  const deleted = db.deleteUser(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Specified user to delete was not found' });
  }
  res.json({ success: true, message: 'User record deleted successfully' });
});


// --- 3. PRODUCTS SERVICE CATALOGUE ---

// Search & filter products list (Public)
app.get('/api/products', (req, res) => {
  let list = db.getProducts();

  const { search, category, sellerId } = req.query;

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }

  if (category) {
    list = list.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
  }

  if (sellerId) {
    list = list.filter(p => p.sellerId === String(sellerId));
  }

  res.json(list);
});

// Admin-Seller product file upload route
app.post('/api/products/upload-image', verifyToken, requireRole(['admin', 'seller']), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl: fileUrl });
});

// Create product listing (Admin/Seller)
app.post('/api/products', verifyToken, requireRole(['admin', 'seller']), (req: any, res: any) => {
  const { name, price, category, stock, image } = req.body;
  if (!name || price === undefined || !category || stock === undefined) {
    return res.status(400).json({ error: 'Product name, price, stock quantity, and category are required' });
  }

  const finalImage = image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60';

  const newProd = db.createProduct({
    name,
    price: Number(price),
    category,
    stock: Number(stock),
    image: finalImage,
    sellerId: req.user.id,
    sellerName: req.user.name
  });

  res.status(201).json(newProd);
});

// Edit product listing
app.put('/api/products/:id', verifyToken, requireRole(['admin', 'seller']), (req: any, res: any) => {
  const existing = db.getProductById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product profile is not found' });
  }

  // Prevent seller from tampering with other seller goods
  if (req.user.role === 'seller' && existing.sellerId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to edit other seller listing' });
  }

  const updates: any = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.price !== undefined) updates.price = Number(req.body.price);
  if (req.body.category !== undefined) updates.category = req.body.category;
  if (req.body.stock !== undefined) updates.stock = Number(req.body.stock);
  if (req.body.image !== undefined) updates.image = req.body.image;

  const updated = db.updateProduct(req.params.id, updates);
  res.json(updated);
});

// Delete product listing
app.delete('/api/products/:id', verifyToken, requireRole(['admin', 'seller']), (req: any, res: any) => {
  const existing = db.getProductById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product to delete was not found' });
  }

  if (req.user.role === 'seller' && existing.sellerId !== req.user.id) {
    return res.status(403).json({ error: 'Access restricted: can only delete your own listings' });
  }

  db.deleteProduct(req.params.id);
  res.json({ success: true, message: 'Product listing purged successfully' });
});


// --- 4. ORDERS INVOICING SERVICE ---

// Fetch Orders depending on role hierarchy
app.get('/api/orders', verifyToken, (req: any, res) => {
  const role = req.user.role;
  const userId = req.user.id;
  const allOrders = db.getOrders();

  if (role === 'admin') {
    // Admin gets everything
    return res.json(allOrders);
  } else if (role === 'customer') {
    // Customers only get their own receipts
    const customerOrders = allOrders.filter(o => o.userId === userId);
    return res.json(customerOrders);
  } else if (role === 'seller') {
    // Sellers only see order lines containing their goods
    const sellerOrders = allOrders.filter(o => 
      o.products.some((item: any) => {
        const product = db.getProductById(item.productId);
        return product && product.sellerId === userId;
      })
    ).map(o => {
      // Return order but filtered products to only show their items
      const ownItems = o.products.filter((item: any) => {
        const product = db.getProductById(item.productId);
        return product && product.sellerId === userId;
      });
      const itemsTotal = ownItems.reduce((acc: number, curr: any) => acc + (curr.price * curr.qty), 0);
      return {
        ...o,
        products: ownItems,
        total: itemsTotal // seller context order amount
      };
    });
    return res.json(sellerOrders);
  } else if (role === 'delivery') {
    // Delivery drivers see orders associated with their deliveries
    const deliveries = db.getDeliveries().filter(d => d.driverId === userId);
    const orderIds = deliveries.map(d => d.orderId);
    const driverOrders = allOrders.filter(o => orderIds.includes(o.id));
    return res.json(driverOrders);
  }

  res.json([]);
});

// Checkout / Place Order
app.post('/api/orders', verifyToken, requireRole(['customer']), (req: any, res) => {
  const { customerPhone, customerAddress, products } = req.body;
  if (!customerPhone || !customerAddress || !products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Customer contact phone, shipping destination address, and product items are required' });
  }

  // Double check inventory stock and build verified item list
  const verifiedProducts: any[] = [];
  let totalOrderSum = 0;

  for (const item of products) {
    const original = db.getProductById(item.productId);
    if (!original) {
      return res.status(400).json({ error: `Product item with ID ${item.productId} was not found` });
    }
    if (original.stock < item.qty) {
      return res.status(400).json({ error: `Insufficient stock for product ${original.name}. Only ${original.stock} left` });
    }
    
    verifiedProducts.push({
      id: `oi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: original.id,
      name: original.name,
      price: original.price,
      qty: Number(item.qty)
    });

    totalOrderSum += original.price * Number(item.qty);

    // Decrement persistent store inventory
    db.updateProduct(original.id, { stock: original.stock - Number(item.qty) });
  }

  const newOrder = db.createOrder({
    userId: req.user.id,
    customerName: req.user.name,
    customerPhone,
    customerAddress,
    products: verifiedProducts,
    total: Number(totalOrderSum.toFixed(2)),
    status: 'Pending'
  });

  res.status(201).json(newOrder);
});

// Update order status manually
app.put('/api/orders/:id', verifyToken, requireRole(['admin', 'seller', 'delivery']), (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid order status value required' });
  }

  const updated = db.updateOrder(req.params.id, { status });
  if (!updated) {
    return res.status(404).json({ error: 'Target order index was not found' });
  }

  // Keep delivery status synchronized
  const linkedDel = db.getDeliveryByOrderId(req.params.id);
  if (linkedDel) {
    let delStatus = linkedDel.status;
    if (status === 'Cancelled') delStatus = 'Pending';
    else if (status === 'Shipped') delStatus = 'Delivering';
    else if (status === 'Delivered') delStatus = 'Delivered';
    db.updateDelivery(req.params.id, { status: delStatus });
  }

  res.json(updated);
});


// --- 5. DELIVERY MANAGEMENT SYSTEM ---

// Drivers list populate endpoint for admin selectors
app.get('/api/delivery/drivers', verifyToken, requireRole(['admin']), (req, res) => {
  const drivers = db.getUsers()
    .filter(u => u.role === 'delivery' && !u.isBanned)
    .map(({ password, ...u }) => u);
  res.json(drivers);
});

// Fetch deliverable units
app.get('/api/delivery', verifyToken, requireRole(['admin', 'delivery']), (req: any, res) => {
  const role = req.user.role;
  const list = db.getDeliveries();

  if (role === 'admin') {
    return res.json(list);
  } else if (role === 'delivery') {
    // Riders view active deliveries either assigned to them, or open unassigned matching drivers
    const riderList = list.filter(d => d.driverId === req.user.id || !d.driverId);
    return res.json(riderList);
  }

  res.json([]);
});

// Assign driver to shipment, or update delivery status
app.put('/api/delivery/:orderId', verifyToken, requireRole(['admin', 'delivery']), (req: any, res) => {
  const { driverId, status } = req.body;
  const existingDelivery = db.getDeliveryByOrderId(req.params.orderId);

  if (!existingDelivery) {
    return res.status(404).json({ error: 'Associated delivery profile not found' });
  }

  const updates: any = {};

  // Driver Assignment Logic (Admin specific)
  if (driverId !== undefined) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrative accounts can allocate drivers' });
    }
    
    if (driverId === '') {
      updates.driverId = '';
      updates.driverName = 'Not Assigned';
    } else {
      const driver = db.getUserById(driverId);
      if (!driver || driver.role !== 'delivery') {
        return res.status(400).json({ error: 'Valid active driver ID required' });
      }
      updates.driverId = driver.id;
      updates.driverName = driver.name;
    }
  }

  // Delivery rider updating tracking tags
  if (status !== undefined) {
    const validDelivStatus = ['Pending', 'Picked Up', 'Delivering', 'Delivered'];
    if (!validDelivStatus.includes(status)) {
      return res.status(400).json({ error: 'Invalid delivery tracking tag name' });
    }
    updates.status = status;
  }

  const updated = db.updateDelivery(req.params.orderId, updates);
  res.json(updated);
});


// --- 6. DYNAMIC ORDER PLAIN-TEXT REPORT EXPORT SYSTEM ---

app.get('/api/export/txt', verifyToken, requireRole(['admin']), (req, res) => {
  const orders = db.getOrders();
  
  // Header line
  let content = 'OrderID | Customer | Phone | Address | Product | Qty | Total | Status\r\n';

  // Build rows block
  orders.forEach(o => {
    o.products.forEach((p: any) => {
      content += `${o.id} | ${o.customerName} | ${o.customerPhone} | ${o.customerAddress} | ${p.name} | ${p.qty} | $${(p.price * p.qty).toFixed(2)} | ${o.status}\r\n`;
    });
  });

  // Serve text plain file stream instantly
  res.setHeader('Content-disposition', `attachment; filename=orders_manifest_${Date.now()}.txt`);
  res.setHeader('Content-type', 'text/plain');
  res.charset = 'UTF-8';
  res.write(content);
  res.end();
});


// --- 7. SPECIAL STATS ENDPOINTS FOR DASHBOARDS ---

// Comprehensive stats summaries
app.get('/api/stats/summary', verifyToken, requireRole(['admin']), (req, res) => {
  const users = db.getUsers();
  const orders = db.getOrders();
  const products = db.getProducts();

  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const roleBreakdown: Record<string, number> = { admin: 0, seller: 0, customer: 0, delivery: 0 };
  users.forEach(u => {
    if (roleBreakdown[u.role] !== undefined) roleBreakdown[u.role]++;
  });

  // Sales grouped by category
  const salesMap: Record<string, { count: number; value: number }> = {};
  orders.filter(o => o.status !== 'Cancelled').forEach(o => {
    o.products.forEach((item: any) => {
      const p = products.find(pr => pr.id === item.productId);
      const cat = p ? p.category : 'General Items';
      if (!salesMap[cat]) salesMap[cat] = { count: 0, value: 0 };
      salesMap[cat].count += item.qty;
      salesMap[cat].value += item.price * item.qty;
    });
  });

  const categorySales = Object.entries(salesMap).map(([category, stats]) => ({
    category,
    count: stats.count,
    value: Number(stats.value.toFixed(2))
  }));

  // Simple monthly breakdown mock
  const monthlyRevenue = [
    { month: 'Jan', amount: Number((totalRevenue * 0.15).toFixed(2)) },
    { month: 'Feb', amount: Number((totalRevenue * 0.20).toFixed(2)) },
    { month: 'Mar', amount: Number((totalRevenue * 0.18).toFixed(2)) },
    { month: 'Apr', amount: Number((totalRevenue * 0.22).toFixed(2)) },
    { month: 'May', amount: Number((totalRevenue * 0.25).toFixed(2)) }
  ];

  res.json({
    totalUsers,
    totalOrders,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    roleBreakdown,
    categorySales,
    monthlyRevenue
  });
});

// Seller Stats
app.get('/api/stats/seller', verifyToken, requireRole(['seller']), (req: any, res) => {
  const id = req.user.id;
  const prods = db.getProducts().filter(p => p.sellerId === id);
  const orders = db.getOrders();

  let sellerRevenue = 0;
  let productsSold = 0;
  let relatedOrdersCount = 0;

  orders.forEach(o => {
    let orderMatched = false;
    o.products.forEach((item: any) => {
      const isMine = prods.some(p => p.id === item.productId);
      if (isMine) {
        orderMatched = true;
        productsSold += item.qty;
        if (o.status !== 'Cancelled') {
          sellerRevenue += item.price * item.qty;
        }
      }
    });
    if (orderMatched) {
      relatedOrdersCount++;
    }
  });

  res.json({
    totalProducts: prods.length,
    totalSales: productsSold,
    totalRevenue: Number(sellerRevenue.toFixed(2)),
    recentOrdersCount: relatedOrdersCount
  });
});


// --- 8. MIDDLEWARE & SPA FALLBACK SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Dev server uses Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production serves static production builds
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`E-Commerce Server running dynamically on http://0.0.0.0:${PORT}`);
  });
}

startServer();
