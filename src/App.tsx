import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { TranslationProvider, useTranslation } from './context/TranslationContext.js';
import { NotificationProvider } from './components/Notification.js';
import Sidebar from './components/Sidebar.js';
import Auth from './pages/Auth.js';
import CustomerPortal from './pages/CustomerPortal.js';
import AdminPortal from './pages/AdminPortal.js';
import SellerPortal from './pages/SellerPortal.js';
import DeliveryPortal from './pages/DeliveryPortal.js';
import { Menu, Star } from 'lucide-react';

function DashboardRouter() {
  const { user, token, loading } = useAuth();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set default tabs based on log-in role
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') setActiveTab('dashboard');
      else if (user.role === 'seller') setActiveTab('dashboard');
      else if (user.role === 'delivery') setActiveTab('dashboard');
      else if (user.role === 'customer') setActiveTab('shop');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-xs font-mono tracking-wider uppercase font-bold">Checking active sessions...</p>
      </div>
    );
  }

  // Not logged in -> Auth view wrapper
  if (!user || !token) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* Sleek Collapsible Sidebar Navigation Panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Viewport Container */}
      <main className="flex-grow min-h-screen overflow-x-hidden pt-12 md:pt-0">
        
        {/* Floating Hamburger bar for narrow devices */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-30">
          <span className="text-slate-200 font-black text-xs uppercase tracking-widest">{t('appName')}</span>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 px-2.5 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-all text-xs font-semibold"
          >
            Menu
          </button>
        </div>

        {/* Dynamic Inner Portal View based on active role identity & selected Tab */}
        
        {/* Portal 1: Admin Administration dashboard */}
        {user.role === 'admin' && (
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && <AdminPortal />}
            {activeTab === 'users' && <AdminPortal />}
            {activeTab === 'products' && <AdminPortal />}
            {activeTab === 'orders' && <AdminPortal />}
            {activeTab === 'delivery' && <AdminPortal />}
          </div>
        )}

        {/* Portal 2: Multivendor Seller catalog lists */}
        {user.role === 'seller' && (
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && <SellerPortal />}
            {activeTab === 'products' && <SellerPortal />}
            {activeTab === 'orders' && <SellerPortal />}
          </div>
        )}

        {/* Portal 3: Client store with direct listings */}
        {user.role === 'customer' && (
          <div className="animate-fade-in">
            {activeTab === 'shop' && <CustomerPortal initialTab="shop" />}
            {activeTab === 'orders' && <CustomerPortal initialTab="orders" />}
          </div>
        )}

        {/* Portal 4: Logistics driver allocations details */}
        {user.role === 'delivery' && (
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && <DeliveryPortal />}
          </div>
        )}

      </main>
    </div>
  );
}

export default function App() {
  return (
    <TranslationProvider>
      <AuthProvider>
        <NotificationProvider>
          <DashboardRouter />
        </NotificationProvider>
      </AuthProvider>
    </TranslationProvider>
  );
}
