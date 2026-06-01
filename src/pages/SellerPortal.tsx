import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/TranslationContext.js';
import { useNotification } from '../components/Notification.js';
import api from '../services/api.js';
import { Product, Order, SellerStats } from '../types.js';
import { 
  Package, 
  FileText, 
  TrendingUp, 
  PlusCircle, 
  ImageIcon, 
  Upload, 
  Trash2, 
  DollarSign, 
  TrendingUp as TrendUp, 
  ShoppingBag,
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SellerPortal() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');

  // Stats
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Entities
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Details
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productFormId, setProductFormId] = useState<string | null>(null);
  const [productFormName, setProductFormName] = useState('');
  const [productFormPrice, setProductFormPrice] = useState('');
  const [productFormStock, setProductFormStock] = useState('');
  const [productFormCategory, setProductFormCategory] = useState('Fashion');
  const [productFormImage, setProductFormImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books & Stationery', 'Sports & Outdoors'];

  const getSellerStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/api/stats/seller');
      setStats(res.data);
    } catch (err) {
      showNotification('Failed to load seller performance summary', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get(`/api/products?sellerId=${user?.id}`);
      setProducts(res.data);
    } catch (err) {
      showNotification('Could not load products inventory', 'error');
    }
  };

  const loadOrders = async () => {
    try {
      const res = await api.get('/api/orders');
      setOrders(res.data);
    } catch (err) {
      showNotification('Could not load order book', 'error');
    }
  };

  const syncAllData = async () => {
    setLoading(true);
    await Promise.all([
      getSellerStats(),
      loadProducts(),
      loadOrders()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    syncAllData();
  }, [activeTab]);


  // --- PRODUCTS CRUD CONTROLS ---

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

  const handleImageUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const form = new FormData();
    form.append('image', file);

    try {
      const res = await api.post('/api/products/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProductFormImage(res.data.imageUrl);
      showNotification('Product photo uploaded successfully to backend workspace', 'success');
    } catch (err) {
      showNotification('Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
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
        showNotification('Product details modified successfully', 'success');
      } else {
        await api.post('/api/products', payload);
        showNotification('Listed new product to catalogue', 'success');
      }
      setIsProductModalOpen(false);
      loadProducts();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Product registration failed', 'error');
    }
  };

  const handlePurgeProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete your listing?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      showNotification('Listing removed safely from store databases', 'info');
      loadProducts();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Purging listing failed', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/api/orders/${orderId}`, { status });
      showNotification(`Order tracking reference ${orderId} status set to ${status}`, 'success');
      loadOrders();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to sync statuses', 'error');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-600" />
            {t('sellerPanel')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Control pricing ratios and available warehouse levels.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dashboard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('dashboard')}
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('ownProducts')} ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('ownOrders')} ({orders.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center bg-white rounded-3xl border border-slate-100">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-400 text-xs font-mono">Syncing merchant assets...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: SELLER PERFORMANCE OVERVIEW */}
          {activeTab === 'dashboard' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Active Listings</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalProducts}</h3>
                  <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-2">
                    <span>• Catalog published safely</span>
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Package className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Items Cashout Sales</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalSales}</h3>
                  <p className="text-[10px] text-slate-400 mt-2">Quantities sold</p>
                </div>
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">{t('ownRevenue')}</span>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">${stats.totalRevenue.toFixed(2)}</h3>
                  <p className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 mt-2">
                    <span>• Backed by BAKONG Escrow</span>
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MANAGE SELLER'S OWN PRODUCTS */}
          {activeTab === 'products' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              
              <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">My Shop Directory</h3>
                  <p className="text-xs text-slate-400 mt-0.5">List products, manage category groups, and check stock levels.</p>
                </div>
                <button
                  onClick={() => handleOpenProductModal(null)}
                  className="py-2.5 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List New Product</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase tracking-widest font-mono border-b border-slate-100">
                      <th className="p-4 font-black">Thumbnail</th>
                      <th className="p-4 font-black">Product Name</th>
                      <th className="p-4 font-black">Category</th>
                      <th className="p-4 font-black">Price ($USD)</th>
                      <th className="p-4 font-black">Warehouse levels</th>
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
                        <td className="p-4 font-black text-slate-800 truncate max-w-[200px]">{p.name}</td>
                        <td className="p-4 font-medium text-slate-500">{p.category}</td>
                        <td className="p-4 font-mono font-bold text-slate-900">${p.price.toFixed(2)}</td>
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
                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => handleOpenProductModal(p)}
                            className="p-1 px-2.5 bg-slate-50 border border-slate-200/55 text-slate-600 hover:text-black rounded-lg hover:border-slate-400 transition-all font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePurgeProduct(p.id)}
                            className="p-1 px-1.5 bg-slate-50 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-block"
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

          {/* TAB 3: MANAGE ORDERS CONTAINING OWNER PRODUCTS */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-black text-slate-900">My Sales Orders</h3>
                <p className="text-xs text-slate-400 mt-0.5">Filter sales lists, audit purchase quantities, and update order statuses.</p>
              </div>

              <div className="space-y-6">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-250 pb-3 text-xs font-semibold">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-800 text-sm">{o.id}</span>
                          <span className="text-slate-400">• {new Date(o.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Phone: {o.customerPhone}</span>
                          <span>Address: {o.customerAddress}</span>
                        </div>
                      </div>

                      {/* Status select config */}
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Order Cycle:</label>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[10px] outline-none font-bold text-slate-700 uppercase"
                        >
                          {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Sales Goods List */}
                    <div className="space-y-1.5 text-xs">
                      {o.products.map(p => (
                        <div key={p.id} className="flex justify-between items-center py-0.5">
                          <span className="text-slate-600 font-semibold">{p.qty}x • {p.name}</span>
                          <span className="font-mono text-slate-400">${(p.price * p.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <hr className="border-slate-105" />

                    <div className="flex justify-between items-center font-bold text-xs pt-1">
                      <span className="text-slate-400 uppercase text-[10px]">My Share Volume:</span>
                      <span className="font-mono text-slate-900 text-sm font-black">${o.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>
      )}

      {/* DETAILED DIALOG MODAL WINDOW: LIST NEW / EDIT PRODUCT CARD */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 animate-fade-in">
            <div onClick={() => setIsProductModalOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"></div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full border border-slate-100 shadow-2xl relative z-60 space-y-6"
            >
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {productFormId ? 'Modify Product Card' : 'List New Product'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Control pricing ratios and available warehouse levels.</p>
              </div>

              <form onSubmit={handleProductFormSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productFormName}
                    onChange={(e) => setProductFormName(e.target.value)}
                    placeholder="Premium Cambodian Silk"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
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
                      placeholder="35.00"
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-750"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Stock Count</label>
                    <input
                      type="number"
                      required
                      value={productFormStock}
                      onChange={(e) => setProductFormStock(e.target.value)}
                      placeholder="20"
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-750"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Category Division</label>
                  <select
                    value={productFormCategory}
                    onChange={(e) => setProductFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 outline-none font-semibold text-slate-700"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* File Upload details */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Product Picture</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                    <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {productFormImage ? (
                        <img src={productFormImage} alt="Uploaded" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-350" />
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
                            onChange={handleImageUploadChange}
                            className="hidden"
                            id="seller-photo-uploader"
                          />
                          <label
                            htmlFor="seller-photo-uploader"
                            className="inline-flex items-center gap-1 py-1 px-2.5 bg-white border border-slate-200 hover:border-slate-400 rounded-lg text-[10px] font-bold text-slate-600 hover:text-indigo-650 cursor-pointer shadow-xs"
                          >
                            <Upload className="w-3 h-3" />
                            Upload local photo
                          </label>
                          <span className="text-[9px] text-slate-400 block font-mono">Or provide custom URL below</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Direct input fallback */}
                  <input
                    type="text"
                    value={productFormImage}
                    onChange={(e) => setProductFormImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 px-3 text-[10px] font-mono mt-2 outline-none text-slate-500"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-grow py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow shadow-indigo-150 hover:bg-indigo-700 transition-all text-center cursor-pointer font-sans"
                  >
                    Save Product Card
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
}
