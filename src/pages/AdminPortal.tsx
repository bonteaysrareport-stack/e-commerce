import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/TranslationContext.js';
import { useNotification } from '../components/Notification.js';
import api from '../services/api.js';
import { User, Product, Order, Delivery, DashboardStats } from '../types.js';
import { 
  Users, 
  Package, 
  FileText, 
  TrendingUp, 
  UserX, 
  Ban, 
  Power, 
  Trash2, 
  Edit, 
  PlusCircle, 
  Upload, 
  Download, 
  Truck, 
  CreditCard, 
  Image as ImageIcon,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPortal() {
  const { user: currentAdmin } = useAuth();
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'products' | 'orders' | 'payments'>('dashboard');

  // Stats Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Entities Data tables
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  // --- FORM STATES FOR CREATE/EDIT MODAL ---

  // User form details
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormId, setUserFormId] = useState<string | null>(null);
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'seller' | 'customer' | 'delivery'>('customer');

  // Product form details
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productFormId, setProductFormId] = useState<string | null>(null);
  const [productFormName, setProductFormName] = useState('');
  const [productFormPrice, setProductFormPrice] = useState('');
  const [productFormStock, setProductFormStock] = useState('');
  const [productFormCategory, setProductFormCategory] = useState('Fashion');
  const [productFormImage, setProductFormImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // General Categories
  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books & Stationery', 'Sports & Outdoors'];

  // --- QUERY APIS ---

  const loadDashboardData = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/api/stats/summary');
      setStats(res.data);
    } catch (err: any) {
      showNotification('Failed to retrieve statistic summaries', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
       const res = await api.get('/api/users');
       setUsers(res.data);
    } catch (err) {
      showNotification('Failed to retrieve users directory', 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      showNotification('Could not load products inventory', 'error');
    }
  };

  const fetchOrdersAndDeliveries = async () => {
    try {
      const ordRes = await api.get('/api/orders');
      setOrders(ordRes.data);

      const delRes = await api.get('/api/delivery');
      setDeliveries(delRes.data);

      const driverRes = await api.get('/api/delivery/drivers');
      setDrivers(driverRes.data);
    } catch (err) {
       showNotification('Could not gather logistics matrices', 'error');
    }
  };

  const runAllFetches = async () => {
    setLoading(true);
    await Promise.all([
      loadDashboardData(),
      fetchUsers(),
      fetchProducts(),
      fetchOrdersAndDeliveries()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    runAllFetches();
  }, [activeTab]);


  // --- USER OPERATIONS CRUD ---

  const handleOpenUserModal = (target: User | null = null) => {
    if (target) {
      setUserFormId(target.id);
      setUserFormName(target.name);
      setUserFormEmail(target.email);
      setUserFormPassword('');
      setUserFormRole(target.role);
    } else {
      setUserFormId(null);
      setUserFormName('');
      setUserFormEmail('');
      setUserFormPassword('');
      setUserFormRole('customer');
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: userFormName,
        email: userFormEmail,
        role: userFormRole
      };
      if (userFormPassword) payload.password = userFormPassword;

      if (userFormId) {
        // Edit Mode
        const res = await api.put(`/api/users/${userFormId}`, payload);
        showNotification(`User details of ${res.data.name} updated successfully`, 'success');
      } else {
        // Create Mode
        if (!userFormPassword) {
          showNotification('Password is required for adding new profiles', 'error');
          return;
        }
        payload.password = userFormPassword;
        const res = await api.post(`/api/users`, payload);
        showNotification(`Successfully created user ${res.data.name}`, 'success');
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'Failed to submit user payload', 'error');
    }
  };

  const handleBanToggle = async (target: User) => {
    try {
      const res = await api.put(`/api/users/${target.id}`, { isBanned: !target.isBanned });
      showNotification(
        `Session status representing ${res.data.name} is now ${res.data.isBanned ? 'SUSPENDED' : 'ACTIVE'}`,
        res.data.isBanned ? 'error' : 'success'
      );
      fetchUsers();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to modify ban state', 'error');
    }
  };

  const handleDeleteUser = async (tokenId: string) => {
    if (!window.confirm('Are you absolute sure you want to permanently delete this user? This cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/api/users/${tokenId}`);
      showNotification('User profile account has been purged', 'info');
      fetchUsers();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };


  // --- PRODUCT OPERATIONS CRUD ---

  const handleOpenProductModal = (target: Product | null = null) => {
    if (target) {
      setProductFormId(target.id);
      setProductFormName(target.name);
      setProductFormPrice(String(target.price));
      setProductFormStock(String(target.stock));
      setProductFormCategory(target.category);
      setProductFormImage(target.image);
    } else {
      setProductFormId(null);
      setProductFormName('');
      setProductFormPrice('');
      setProductFormStock('');
      setProductFormCategory('Fashion');
      setProductFormImage('');
    }
    setIsProductModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/api/products/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setProductFormImage(res.data.imageUrl);
      showNotification('Product photo uploaded successfully to backend workspace', 'success');
    } catch (err) {
      showNotification('Failed to upload product image file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormName || !productFormPrice || !productFormStock) {
      showNotification('Please fill in product name, price, and stock quantity', 'error');
      return;
    }

    try {
      const payload = {
        name: productFormName,
        price: Number(productFormPrice),
        stock: Number(productFormStock),
        category: productFormCategory,
        image: productFormImage
      };

      if (productFormId) {
        await api.put(`/api/products/${productFormId}`, payload);
        showNotification('Product stock card changed successfully', 'success');
      } else {
        await api.post('/api/products', payload);
        showNotification('New product added to store listing directory', 'success');
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to submit product catalog', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product from catalog?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      showNotification('Product card purged from store databases', 'info');
      fetchProducts();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to purge listing', 'error');
    }
  };


  // --- ORDER DISPATCH / DRIVER ALLOCATION ---

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/api/orders/${orderId}`, { status });
      showNotification(`Order status representing ${orderId} updated to ${status}`, 'success');
      fetchOrdersAndDeliveries();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to update order status', 'error');
    }
  };

  const handleAssignRiderToOrder = async (orderId: string, driverId: string) => {
    try {
      await api.put(`/api/delivery/${orderId}`, { driverId });
      showNotification(
        driverId === '' ? 'Rider unassigned from shipping run' : `Successfully assigned logistics rider to invoice`,
        'success'
      );
      fetchOrdersAndDeliveries();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to assign runner to shipment', 'error');
    }
  };


  // --- PLAIN-TEXT REPORT EXPORTER (DYNAMIC FILE GENERATOR) ---

  const handleExportTextManifest = async () => {
    try {
      // Direct stream download helper
      const token = localStorage.getItem('token');
      const response = await fetch('/api/export/txt', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Server reported bad request rules');
      }

      const blob = await response.blob();
      const folderUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = folderUrl;
      link.setAttribute('download', `Angkor_Express_Orders_${Date.now()}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('Product inventory ledger manifest downloaded instantly!', 'success');
    } catch (err) {
      showNotification('Failed to download orders ledger report', 'error');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Upper Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            {t('adminPanel')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage operational hierarchies, catalog listings, deliveries, and exports.</p>
        </div>

        {/* Dynamic Plaintext orders reports triggers */}
        <button
          onClick={handleExportTextManifest}
          className="py-2.5 px-4 bg-indigo-600 shadow-md shadow-indigo-100 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-indigo-700 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{t('exportTxt')}</span>
        </button>
      </div>

      {/* Tabs list menu */}
      <div className="flex flex-wrap gap-2.5 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dashboard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Dashboard & Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('users')}
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('products')}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('orders')}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payments' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Payment Clearing
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-400 text-xs font-mono">Syncing operational data models...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS DASHBOARD */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-8 animate-fade-in">
              {/* Summary Scorecards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Total users</span>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalUsers}</h3>
                    <div className="flex gap-1.5 text-[9px] text-slate-400 font-mono mt-2">
                      <span className="bg-slate-50 p-1 rounded">A: {stats.roleBreakdown.admin}</span>
                      <span className="bg-slate-50 p-1 rounded">S: {stats.roleBreakdown.seller}</span>
                      <span className="bg-slate-50 p-1 rounded">C: {stats.roleBreakdown.customer}</span>
                      <span className="bg-slate-50 p-1 rounded">D: {stats.roleBreakdown.delivery}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Total Orders</span>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalOrders}</h3>
                    <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-2">
                      <span>• Logistics Streamlines Active</span>
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Total Revenue</span>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">${stats.totalRevenue.toFixed(2)}</h3>
                    <p className="text-[10px] text-indigo-500 font-bold. flex items-center gap-1 mt-2">
                      <span>• Acleda Bank / Bakong synced</span>
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Graphical Analysis with Custom UI Vectors (Instead of external recharts) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Custom Graph 1: Revenue Analytics */}
                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">Revenue Trends </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Chronological sales charts across core quarters</p>
                  </div>

                  {/* SVG Bar layout */}
                  <div className="h-64 flex items-end justify-between gap-4 pt-6 border-b border-slate-100 relative">
                    {/* Y-axis markers */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 font-mono w-full pointer-events-none pr-8">
                      <div className="border-t border-slate-100 w-full pt-1 text-right">Max Limit</div>
                      <div className="border-t border-slate-100 w-full pt-1 text-right">50% Cap</div>
                      <div className="w-full text-right pb-1">Zero base</div>
                    </div>

                    {stats.monthlyRevenue.map((d, index) => {
                      const peakRevenue = Math.max(...stats.monthlyRevenue.map(m => m.amount)) || 100;
                      const ratio = (d.amount / peakRevenue) * 100 || 20;

                      return (
                        <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                          {/* Rich interactive tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg font-mono font-bold whitespace-nowrap transition-all shadow shadow-black">
                            ${d.amount.toFixed(2)}
                          </div>
                          {/* Column Bar graphic */}
                          <div
                            style={{ height: `${ratio * 1.5}px` }}
                            className="bg-indigo-600/90 hover:bg-indigo-600 w-full max-w-[40px] rounded-t-lg transition-all cursor-pointer relative shadow shadow-indigo-100"
                          ></div>
                          <span className="text-[10px] font-black text-slate-500 font-mono">{d.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Chart 2: Category sales breakdown */}
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">Sales Category Volume</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Breakdowns of products sold by divisions</p>
                  </div>

                  <div className="space-y-4 pt-3">
                    {stats.categorySales.map((c) => (
                      <div key={c.category} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{c.category}</span>
                          <span className="font-mono text-slate-500">{c.count} items (${c.value})</span>
                        </div>
                        {/* Progressive slider bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (c.value / (stats.totalRevenue || 1)) * 100)}%` }}
                            className="bg-indigo-600 h-full rounded-full transition-all"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER DIRECTORIES MODERATOR */}
          {activeTab === 'users' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">User Profiles Listing</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Create staff roles, block suspicious buyers, and update metadata.</p>
                </div>
                <button
                  onClick={() => handleOpenUserModal(null)}
                  className="py-2 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow shadow-indigo-150 hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100">
                      <th className="p-4 font-black">Role ID</th>
                      <th className="p-4 font-black">Name</th>
                      <th className="p-4 font-black">Email</th>
                      <th className="p-4 font-black">Platform role</th>
                      <th className="p-4 font-black">Status</th>
                      <th className="p-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-medium">
                        <td className="p-4 font-mono text-slate-400">{u.id}</td>
                        <td className="p-4 font-bold text-slate-800">{u.name}</td>
                        <td className="p-4 font-semibold text-slate-700">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 font-bold uppercase rounded text-[9px] ${
                            u.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-700'
                              : u.role === 'seller'
                              ? 'bg-emerald-100 text-emerald-700'
                              : u.role === 'delivery'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          {u.isBanned ? (
                            <span className="flex items-center gap-1 text-rose-600 font-bold text-[10px]">
                              <Ban className="w-3.5 h-3.5" />
                              Banned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                              <Power className="w-3.5 h-3.5" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenUserModal(u)}
                            className="p-1 px-2.5 bg-slate-50 border border-slate-200/55 text-slate-600 hover:text-black rounded-lg hover:border-slate-400 transition-all font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleBanToggle(u)}
                            className={`p-1 px-2 text-[10px] font-bold rounded-lg transition-all ${
                              u.isBanned 
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white'
                            }`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 px-1.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS INVENTORY CATALOGUE */}
          {activeTab === 'products' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Products Stock Catalogue</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Create product categories, change stock metrics, upload picture assets.</p>
                </div>
                <button
                  onClick={() => handleOpenProductModal(null)}
                  className="py-2 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow shadow-indigo-150 hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List New Product</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100">
                      <th className="p-4 font-black">Thumbnail</th>
                      <th className="p-4 font-black">Product Name</th>
                      <th className="p-4 font-black">Category</th>
                      <th className="p-4 font-black">Price ($)</th>
                      <th className="p-4 font-black">Stock levels</th>
                      <th className="p-4 font-black">Seller source</th>
                      <th className="p-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors font-semibold">
                        <td className="p-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-800 truncate max-w-[200px]">{p.name}</td>
                        <td className="p-4 font-medium text-slate-500">{p.category}</td>
                        <td className="p-4 font-mono font-bold text-slate-800">${p.price.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            p.stock > 10
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.stock > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-400">{p.sellerName}</td>
                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenProductModal(p)}
                            className="p-1 px-2.5 bg-slate-50 border border-slate-200/55 text-slate-600 hover:text-black rounded-lg hover:border-slate-400 transition-all font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1 px-1.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-block align-middle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS DESK & DISPATCH (DRIVERS ASSIGNMENTS) */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Orders Desk & Dispatch</h3>
                <p className="text-xs text-slate-400 mt-0.5">Control shipping cycles, check delivery details, and match couriers.</p>
              </div>

              <div className="space-y-6">
                {orders.map((o) => {
                  const linkedDelivery = deliveries.find(d => d.orderId === o.id);

                  return (
                    <div
                      key={o.id}
                      className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4"
                    >
                      {/* Top ribbon summary */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-slate-800 text-sm">{o.id}</span>
                            <span className="text-slate-400">• {new Date(o.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                            <span>Phone: {o.customerPhone}</span>
                            <span>Dest: {o.customerAddress}</span>
                            <span>Buyer: {o.customerName}</span>
                          </div>
                        </div>

                        {/* Status update selector */}
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="text-[10px] font-black uppercase text-slate-400">Order Cycle:</label>
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="bg-white border border-slate-200/90 rounded-lg py-1 px-2.5 font-semibold text-slate-800 uppercase text-[10px] outline-none"
                          >
                            {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Items loop */}
                      <div className="space-y-1.5 text-xs">
                        {o.products.map(p => (
                          <div key={p.id} className="flex justify-between items-center py-0.5">
                            <span className="text-slate-600">{p.qty}x • {p.name}</span>
                            <span className="font-mono text-slate-400">${(p.price * p.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <hr className="border-slate-100" />

                      {/* Dispatch controls / Deliveries Matchmakers */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 font-medium text-xs">
                        <div className="flex items-center gap-1 font-black font-mono">
                          <span className="text-slate-400 uppercase text-[10px]">Total Invoice Sum:</span>
                          <span className="text-slate-800 text-sm font-black">${o.total.toFixed(2)}</span>
                        </div>

                        {/* Assign Rider tools */}
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-450">
                            <Truck className="w-4 h-4 text-slate-400" />
                            Logistics Courier:
                          </span>
                          
                          {linkedDelivery ? (
                            <select
                              value={linkedDelivery.driverId || ''}
                              onChange={(e) => handleRiderSelectorChange(o.id, e.target.value)}
                              className="bg-white border border-slate-200/90 rounded-lg py-1 px-2.5 font-bold text-[10px] outline-none"
                            >
                              <option value="">{t('unassigned')}</option>
                              {drivers.map(drv => (
                                <option key={drv.id} value={drv.id}>{drv.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[10px] text-rose-500 font-bold border-l-2 border-rose-500 pl-1.5 leading-none">Logistics Out Of Sync</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENT CLEARING & BAKONG KHQR LEDGER */}
          {activeTab === 'payments' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Payment Clearing & Bakong KHQR Ledger</h3>
                <p className="text-xs text-slate-400 mt-0.5">Audit electronic banking tokens, check mock KHQR hashes, and manage accounting flows.</p>
              </div>

              {/* Logs loops */}
              <div className="space-y-4">
                {orders.filter(o => o.status !== 'Cancelled').map((o) => {
                  const base64Token = btoa(`bakong-invoice-${o.id}-${o.total}`);

                  return (
                    <div
                      key={o.id}
                      className="bg-slate-50 border-l-4 border-amber-500 p-4 rounded-r-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-semibold text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block py-0.5 px-2 bg-amber-500 text-white font-mono rounded text-[9px] font-black">KHQR APPROVED</span>
                          <span className="font-mono text-slate-800 font-black">{o.id}</span>
                          <span className="text-slate-400 font-mono">• Hash: ks_bkg_clear_{base64Token.substring(0, 12)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-normal">
                          Receiver: <strong className="text-slate-705">Angkor Express Merchant</strong> • Customer: {o.customerName} ({o.customerPhone})
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Credit Net</span>
                        <span className="text-base font-black text-slate-900 font-mono">${o.total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAILED DIALOG MODAL Window: CREATE/EDIT USER PROFILE */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <div onClick={() => setIsUserModalOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer animate-fade-in"></div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative z-60 space-y-6"
            >
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {userFormId ? 'Modify User Profile' : 'Create New User Profile'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Assign custom operational authorization rules.</p>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userFormName}
                    onChange={(e) => setUserFormName(e.target.value)}
                    placeholder="Alice Smith"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    placeholder="alice@email.com"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    {userFormId ? 'Change Password (Leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required={!userFormId}
                    value={userFormPassword}
                    onChange={(e) => setUserFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Platform Role</label>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {(['customer', 'seller', 'delivery', 'admin'] as const).map(roleOption => (
                      <button
                        key={roleOption}
                        type="button"
                        onClick={() => setUserFormRole(roleOption)}
                        className={`py-2 px-1 text-center font-bold border rounded-xl transition-all ${
                          userFormRole === roleOption
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}
                      >
                        {roleOption.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow shadow-indigo-150 hover:bg-indigo-700 transition-all text-center cursor-pointer"
                  >
                    Save Profile Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-4 py-3 bg-slate-50 border border-slate-150 text-slate-500 hover:text-black font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED DIALOG MODAL WINDOW: CREATE/EDIT PRODUCT CARD */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <div onClick={() => setIsProductModalOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer animate-fade-in"></div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative z-60 space-y-6"
            >
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {productFormId ? 'Modify Product Card' : 'List New Product'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Control pricing ratios and available warehouse levels.</p>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productFormName}
                    onChange={(e) => setProductFormName(e.target.value)}
                    placeholder="Kampot Pepper Shaker"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Price ($USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productFormPrice}
                      onChange={(e) => setProductFormPrice(e.target.value)}
                      placeholder="18.50"
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Stock count</label>
                    <input
                      type="number"
                      required
                      value={productFormStock}
                      onChange={(e) => setProductFormStock(e.target.value)}
                      placeholder="40"
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Category division</label>
                  <select
                    value={productFormCategory}
                    onChange={(e) => setProductFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Picture Upload Area */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Product Picture</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                    <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {productFormImage ? (
                        <img src={productFormImage} alt="Uploaded" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-350" />
                      )}
                    </div>
                    <div className="flex-grow space-y-1">
                      {isUploading ? (
                        <span className="text-[10px] font-mono font-bold text-slate-400 animate-pulse block">Uploading to uploads/...</span>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="photo-uploader-input"
                          />
                          <label
                            htmlFor="photo-uploader-input"
                            className="inline-flex items-center gap-1 py-1 px-2.5 bg-white border border-slate-250 rounded-lg text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-600 cursor-pointer shadow-xs"
                          >
                            <Upload className="w-3 h-3" />
                            Upload local image
                          </label>
                          <span className="text-[9px] text-slate-400 block font-mono">Or paste a custom URL below</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Direct Input text fallback */}
                  <input
                    type="text"
                    value={productFormImage}
                    onChange={(e) => setProductFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 px-3 text-[10px] font-mono text-slate-500 mt-2 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow shadow-indigo-150 hover:bg-indigo-700 transition-all text-center cursor-pointer"
                  >
                    Save Product Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-3 bg-slate-50 border border-slate-150 text-slate-500 hover:text-black font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  // Wrap internal function to update handler
  function handleRiderSelectorChange(orderId: string, driverId: string) {
    handleAssignRiderToOrder(orderId, driverId);
  }
}
