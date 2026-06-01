import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/TranslationContext.js';
import { useNotification } from '../components/Notification.js';
import { ShieldCheck, UserCheck, ShoppingBag, Truck, Lock, Mail, UserPlus, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const { login, register } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { showNotification } = useNotification();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        showNotification(`Welcome back! Successfully authenticated.`, 'success');
      } else {
        await register(name, email, password, role);
        showNotification(`Account created successfully! Enjoy shopping.`, 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Authentication failed', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleQuickFill = async (type: 'admin' | 'seller' | 'customer' | 'delivery') => {
    const creds = {
      admin: { e: 'admin@shop.com', p: 'admin123' },
      seller: { e: 'seller@shop.com', p: 'seller123' },
      customer: { e: 'customer@shop.com', p: 'customer123' },
      delivery: { e: 'delivery@shop.com', p: 'delivery123' }
    };

    const target = creds[type];
    setEmail(target.e);
    setPassword(target.p);
    setIsLogin(true);
    showNotification(`Filled credentials for ${type.toUpperCase()}`, 'info');

    // Trigger instant auto login challenge
    setSubmitLoading(true);
    try {
      await login(target.e, target.p);
      showNotification(`Connected securely as ${type.toUpperCase()}`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Auto-submit failed', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-10 px-4 md:px-10">
      {/* Header bar */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center bg-white py-3 px-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none font-sans">
              {t('appName')}
            </h1>
            <span className="text-xs text-slate-400 font-mono">v1.2.0 | Stable</span>
          </div>
        </div>

        {/* Translation Trigger */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              language === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('kh')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all font-sans ${
              language === 'kh' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ភាសាខ្មែរ
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8">
        {/* Left side text detail */}
        <div className="lg:col-span-5 flex flex-col justify-center text-left">
          <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase mb-2 block font-mono">
            ★ All-In-One Enterprise Ledger
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight font-sans">
            Streamlining Khmer E-Commerce Logistics
          </h2>
          <p className="text-slate-500 mt-4 text-sm md:text-base leading-relaxed">
            Manage transactions, control product catalogs, inspect deliveries, and export order books. Log in below to simulate user flows instantly.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-700">Admin Control</h4>
                <p className="text-[10px] text-slate-400">Moderation & reports</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-700">Seller Hub</h4>
                <p className="text-[10px] text-slate-400">Inventory & products</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-700">Client Catalog</h4>
                <p className="text-[10px] text-slate-400">Bakong KHQR cashout</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
              <Truck className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-700">Rider Dispatch</h4>
                <p className="text-[10px] text-slate-400">Delivery checkpoints</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side authentication box */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  {isLogin ? t('login') : t('register')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isLogin ? 'Provide keys to enter hub' : 'Create a fresh account profile'}
                </p>
              </div>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-all"
              >
                {isLogin ? t('register') : t('login')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <label className="text-xs font-bold text-slate-500 mb-1 block">{t('name')}</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="account@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t('role')}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['customer', 'seller', 'delivery', 'admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`text-center py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                          role === r
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm mt-2 flex justify-center items-center"
              >
                {submitLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isLogin ? (
                  t('login')
                ) : (
                  t('register')
                )}
              </button>
            </form>

            {/* Quick Fill Box */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wide mb-3">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                {t('quickFill')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="flex flex-col items-center p-2.5 bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-xl hover:bg-slate-100 transition-all text-center"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600 mb-1" />
                  <span className="text-[10px] font-black text-slate-700 leading-tight">Admin Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('seller')}
                  className="flex flex-col items-center p-2.5 bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-xl hover:bg-slate-100 transition-all text-center"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-black text-slate-700 leading-tight">Seller Panel</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('customer')}
                  className="flex flex-col items-center p-2.5 bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-xl hover:bg-slate-100 transition-all text-center"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-500 mb-1" />
                  <span className="text-[10px] font-black text-slate-700 leading-tight">Customer UI</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('delivery')}
                  className="flex flex-col items-center p-2.5 bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-xl hover:bg-slate-100 transition-all text-center"
                >
                  <Truck className="w-4 h-4 text-indigo-500 mb-1" />
                  <span className="text-[10px] font-black text-slate-700 leading-tight">Delivery Rider</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 font-mono mt-8">
        Angkor Express Hub Ledger • Powered by Node + MongoDB Architecture Fallback
      </div>
    </div>
  );
}
