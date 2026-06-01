import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/TranslationContext.js';
import { useNotification } from '../components/Notification.js';
import api from '../services/api.js';
import { Product, Order, OrderItem } from '../types.js';
import { 
  ShoppingBag, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  Compass, 
  Check, 
  X, 
  CreditCard, 
  Phone, 
  MapPin, 
  Timer, 
  Truck, 
  CheckCircle2, 
  ShoppingBasket 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerPortalProps {
  initialTab?: string;
}

export default function CustomerPortal({ initialTab = 'shop' }: CustomerPortalProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [activeSegment, setActiveSegment] = useState(initialTab === 'orders' ? 'orders' : 'shop');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(300);

  // Cart State
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout Form Details
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentOption, setPaymentOption] = useState<'khqr' | 'cod'>('khqr');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books & Stationery', 'Sports & Outdoors'];

  // Fetch store inventory
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/products');
      setProducts(res.data);
    } catch (error: any) {
      showNotification('Could not load products catalogue', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch client invoices
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/api/orders');
      setOrders(res.data);
    } catch (error: any) {
      showNotification('Could not fetch purchase history', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [activeSegment]);

  // Search filter computes
  const filteredProducts = products.filter(p => {
    const origSearch = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(origSearch) || p.category.toLowerCase().includes(origSearch);
    const matchesCat = selectedCategory ? p.category === selectedCategory : true;
    const matchesPrice = p.price <= maxPrice;
    return matchesSearch && matchesCat && matchesPrice;
  });

  // Basket CRUD utilities
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showNotification('This item is currently out of stock', 'error');
      return;
    }

    setCart(prev => {
      const exist = prev.find(item => item.product.id === product.id);
      if (exist) {
        if (exist.qty >= product.stock) {
          showNotification(`Cannot add more. Only ${product.stock} units available in stock`, 'error');
          return prev;
        }
        showNotification(`Updated ${product.name} quantity to ${exist.qty + 1}`, 'success');
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      showNotification(`Added ${product.name} to basket`, 'success');
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, val: number) => {
    const originProd = products.find(p => p.id === productId);
    if (!originProd) return;

    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const targetQty = item.qty + val;
          if (targetQty <= 0) return null;
          if (targetQty > originProd.stock) {
            showNotification(`Cannot exceed available warehouse stock (${originProd.stock} units)`, 'error');
            return item;
          }
          return { ...item, qty: targetQty };
        }
        return item;
      }).filter(Boolean) as { product: Product; qty: number }[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showNotification('Item removed from cart', 'info');
  };

  const cartTotalSum = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  // Intent to place order validation
  const handleCheckoutIntent = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showNotification('Your shopping basket is empty!', 'error');
      return;
    }
    if (!customerPhone || !customerAddress) {
      showNotification('Please fill in shipping contact phone and address', 'error');
      return;
    }

    if (paymentOption === 'khqr') {
      setIsCheckoutModalOpen(true);
    } else {
      triggerSubmitOrder();
    }
  };

  // Submit secure invoice payload to backend API
  const triggerSubmitOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const productsPayload = cart.map(item => ({
        productId: item.product.id,
        qty: item.qty
      }));

      await api.post('/api/orders', {
        customerPhone,
        customerAddress,
        products: productsPayload
      });

      showNotification('Your order has been placed successfully!', 'success');
      setCart([]);
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      setActiveSegment('orders'); // Jump to histories tracker
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to place order', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Upper toggle tabs */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSegment('shop')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSegment === 'shop'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-150'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            {t('shop')}
          </button>
          <button
            onClick={() => setActiveSegment('orders')}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSegment === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-150'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Timer className="w-4 h-4" />
            {t('orders')} ({orders.length})
          </button>
        </div>

        {/* View basket button floating in upper corner */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="py-2 px-4 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-100 hover:bg-amber-600 transition-all flex items-center gap-2 relative cursor-pointer"
        >
          <ShoppingBasket className="w-4 h-4" />
          <span>{t('cart')}</span>
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-bounce">
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          )}
        </button>
      </div>

      {/* SEGMENT 1: PUBLIC STORE MARKETPLACE CATALOGUE */}
      {activeSegment === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Filters Rail (Col span 3) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit md:sticky md:top-24">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-150">
              <SlidersHorizontal className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Store Filter</h3>
            </div>

            {/* Keyword Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700"
                />
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('category')}</label>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`text-left py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === ''
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  ★ {t('all')} Category
                </button>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`text-left py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === c
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    • {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Scale */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Budget limit</label>
                <span className="font-mono font-bold text-slate-700">${maxPrice}</span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Grid Catalogue displays (Col span 9) */}
          <div className="lg:col-span-9 space-y-6">
            {loading ? (
              <div className="min-h-[400px] flex flex-col justify-center items-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 text-xs font-mono">Fetching latest catalog records...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="min-h-[400px] flex flex-col justify-center items-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center px-6">
                <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No matching items found</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">Try relaxing some filters or adjust your maximum budget slider to explore other items.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map(p => (
                  <motion.div
                    key={p.id}
                    layoutId={`p-card-${p.id}`}
                    className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all flex flex-col group"
                  >
                    {/* Header Image */}
                    <div className="h-48 bg-slate-100 overflow-hidden relative shrink-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                      <span className="absolute top-3 left-3 bg-indigo-600/95 backdrop-blur-md px-3 py-1 text-[10px] font-black tracking-wider text-white uppercase rounded-full">
                        {p.category}
                      </span>
                      {p.stock <= 5 && p.stock > 0 && (
                        <span className="absolute top-3 right-3 bg-rose-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-md animate-pulse">
                          Only {p.stock} left!
                        </span>
                      )}
                      {p.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-black uppercase tracking-widest">
                          Out Of Stock
                        </div>
                      )}
                    </div>

                    {/* Profile details */}
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono font-medium text-slate-400">Listed by {p.sellerName}</span>
                        <h4 className="text-sm font-extrabold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors h-10">
                          {p.name}
                        </h4>
                      </div>

                      <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-50">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">Price</span>
                          <span className="text-lg font-black text-slate-900 font-mono">${p.price.toFixed(2)}</span>
                        </div>

                        <button
                          onClick={() => addToCart(p)}
                          disabled={p.stock === 0}
                          className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{t('addToCart')}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEGMENT 2: CLIENT INVOICE/ORDER HISTORY TRACKER */}
      {activeSegment === 'orders' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">Purchase Invoices History</h3>
            <p className="text-xs text-slate-400 mt-0.5">Track your packages, real-time shipment updates, and bills.</p>
          </div>

          {ordersLoading ? (
            <div className="py-20 flex flex-col justify-center items-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-slate-400 text-xs font-mono">Querying invoice records...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-xs font-semibold">{t('cartEmpty')}</p>
              <button
                onClick={() => setActiveSegment('shop')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow hover:bg-indigo-700 transition-all font-mono"
              >
                Go browse the shop
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 shadow-sm"
                >
                  {/* Ledger summary header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/55 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 font-mono tracking-wide">{o.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono">• {new Date(o.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-4 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {o.customerPhone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {o.customerAddress}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm ${
                        o.status === 'Delivered'
                          ? 'bg-emerald-500 text-white'
                          : o.status === 'Cancelled'
                          ? 'bg-rose-500 text-white'
                          : o.status === 'Shipped'
                          ? 'bg-blue-500 text-white'
                          : o.status === 'Processing'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-400 text-white'
                      }`}>
                        {o.status === 'Pending' && t('pending')}
                        {o.status === 'Processing' && t('processing')}
                        {o.status === 'Shipped' && t('shipped')}
                        {o.status === 'Delivered' && t('delivered')}
                        {o.status === 'Cancelled' && t('cancelled')}
                      </span>
                    </div>
                  </div>

                  {/* List of ordered products */}
                  <div className="space-y-2">
                    {o.products.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-xs font-semibold py-1">
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className="inline-block py-0.5 px-2 bg-indigo-50 text-indigo-700 rounded-md font-bold font-mono">
                            {p.qty}x
                          </span>
                          <span>{p.name}</span>
                        </div>
                        <span className="font-mono text-slate-600">${(p.price * p.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-100" />

                  {/* Net net details */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('total')}</span>
                    <span className="text-lg font-black font-mono text-slate-800">${o.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FLYOUT SLIDEOUT DRAWER: SHOPPING BASKET SUMMARY */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Dark Backdrop overlay */}
            <div
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-45 backdrop-blur-xs cursor-pointer"
            ></div>

            {/* Sidebar drawer body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 border-l border-slate-100 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-150 flex justify-between items-center text-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <ShoppingBasket className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-900">{t('cart')}</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Basket list scroll section */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-xs font-semibold">{t('cartEmpty')}</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-4 py-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all text-xs font-bold font-sans"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 relative group">
                      {/* Thumbnail wrapper */}
                      <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-100">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Description and adjustments block */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-800 leading-tight line-clamp-1">
                            {item.product.name}
                          </h5>
                          <span className="text-[10px] text-indigo-600 font-mono font-bold block mt-0.5">
                            ${item.product.price.toFixed(2)} each
                          </span>
                        </div>

                        {/* Adjust qty buttons */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="w-6 h-6 bg-white border border-slate-100 hover:border-slate-300 text-slate-600 rounded-md font-bold flex items-center justify-center text-xs shadow-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-black text-slate-800 w-5 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="w-6 h-6 bg-white border border-slate-100 hover:border-slate-300 text-slate-600 rounded-md font-bold flex items-center justify-center text-xs shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Remove trash floating corner */}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 self-center hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Invoicing details and Form submission (Required block) */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-150 bg-slate-50/50 space-y-4 shrink-0">
                  <form onSubmit={handleCheckoutIntent} className="space-y-3">
                    {/* Contact Phone */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {t('phone')} *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                        <input
                          type="text"
                          placeholder="012XXXXXXXX"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700"
                          required
                        />
                      </div>
                    </div>

                    {/* Address Detail */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                        {t('address')} *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-450" />
                        <textarea
                          placeholder="Enter your street, building, city context..."
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700 h-16 resize-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Choose Bank / Cash Option */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                        {t('paymentMethod')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentOption('khqr')}
                          className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            paymentOption === 'khqr'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {t('bakongQR')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentOption('cod')}
                          className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            paymentOption === 'cod'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          COD
                        </button>
                      </div>
                    </div>

                    {/* Dividers */}
                    <hr className="border-slate-150 my-2" />

                    {/* Dynamic Total calculation */}
                    <div className="flex justify-between items-center text-slate-800">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Net Total</span>
                      <span className="text-xl font-black font-mono tracking-tight text-slate-900">
                        ${cartTotalSum.toFixed(2)}
                      </span>
                    </div>

                    {/* Instant Submission trigger */}
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-xs uppercase tracking-wider cursor-pointer mt-2"
                    >
                      {paymentOption === 'khqr' ? 'Proceed to QR Scanning' : 'Place Order (COD)'}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL WINDOW: KHMER BAKONG SCANNER SYSTEM (KHQR) */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Dark glass backdrop */}
            <div
              onClick={() => setIsCheckoutModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer animate-fade-in"
            ></div>

            {/* Modal Body card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative z-60 border border-slate-100 text-center space-y-6"
            >
              {/* Header branding */}
              <div className="flex flex-col items-center gap-2">
                <div className="px-3.5 py-1.5 bg-red-600 text-white text-[10px] font-black tracking-widest uppercase rounded-lg shadow-md shadow-red-100 font-mono">
                  KHQR Bakong
                </div>
                <h3 className="text-base font-black text-slate-950 mt-1">{t('checkoutModalTitle')}</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed px-2">
                  {t('checkoutModalDesc')}
                </p>
              </div>

              {/* Dynamic QR canvas layout */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-center items-center gap-3 relative overflow-hidden group">
                <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200/55">
                  {/* Generated QR representation vector */}
                  <div className="w-40 h-40 bg-slate-100 flex flex-col justify-center items-center rounded-lg relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=bakong://pay?merchant_id=angkorexpress%40acleda&amount=${cartTotalSum}&currency=USD&store_name=Angkor+Express+Hub`}
                      alt="Bakong KHQR"
                      className="w-full h-full p-2.5 rounded-lg"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white font-mono font-black text-[9px] py-1 px-1.5 rounded-md border-2 border-white shadow-md">
                      KHQR
                    </div>
                  </div>
                </div>

                {/* Receiver and Sum detail */}
                <div className="text-center font-mono space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Angkor Express Merchant</span>
                  <span className="text-sm font-black text-slate-900">${cartTotalSum.toFixed(2)}</span>
                </div>
              </div>

              {/* Modal controls */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={triggerSubmitOrder}
                  disabled={isPlacingOrder}
                  className="w-full bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all text-xs flex justify-center items-center gap-2 cursor-pointer"
                >
                  {isPlacingOrder ? (
                    <div className="w-5.5 h-5.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>{t('scanCompleted')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors py-1 cursor-pointer"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
