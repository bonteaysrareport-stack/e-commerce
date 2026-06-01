import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/TranslationContext.js';
import { 
  Dribbble, 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  FileText, 
  LogOut, 
  Globe, 
  User, 
  Truck,
  PlusCircle,
  Package,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  if (!user) return null;

  const roleNavItems: Record<string, { id: string; label: string; icon: any }[]> = {
    admin: [
      { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
      { id: 'users', label: t('users'), icon: Users },
      { id: 'products', label: t('products'), icon: Package },
      { id: 'orders', label: t('orders'), icon: FileText },
      { id: 'delivery', label: t('delivery'), icon: Truck }
    ],
    seller: [
      { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
      { id: 'products', label: t('ownProducts'), icon: Package },
      { id: 'orders', label: t('ownOrders'), icon: FileText }
    ],
    delivery: [
      { id: 'dashboard', label: t('driverDashboard'), icon: Truck }
    ],
    customer: [
      { id: 'shop', label: t('shop'), icon: ShoppingBag },
      { id: 'orders', label: t('orders'), icon: FileText }
    ]
  };

  const menuItems = roleNavItems[user.role] || [];

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg ring-4 ring-indigo-50"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Actual Sidebar layout drawers */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-35 h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-6 px-4 border-r border-slate-800 shadow-2xl transition-all duration-300 transform ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 md:translate-x-0 md:w-64'
        }`}
      >
        <div className="flex flex-col gap-6 overflow-y-auto">
          {/* Platform Title */}
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-md text-white shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {isOpen || <div className="hidden md:block">
              <h2 className="text-sm font-black tracking-tight text-white leading-none">
                {t('appName')}
              </h2>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                {user.role} Hub
              </span>
            </div>}
          </div>

          <hr className="border-slate-800" />

          {/* Connected Identity */}
          <div className="p-3 bg-slate-800/50 rounded-2xl flex items-center gap-3 border border-slate-800">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black shrink-0 relative">
              <User className="w-5 h-5" />
              <span className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full absolute -top-0.5 -right-0.5"></span>
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{user.role}</p>
            </div>
          </div>

          {/* Navigation Items list */}
          <nav className="flex flex-col gap-1 mt-2">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="space-y-4 pt-4 border-t border-slate-800 shrink-0">
          {/* Inline Translation switcher inside sidebar */}
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {t('language')}:
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  language === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('kh')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all font-sans ${
                  language === 'kh' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                KH
              </button>
            </div>
          </div>

          {/* Secure Logout trigger */}
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
