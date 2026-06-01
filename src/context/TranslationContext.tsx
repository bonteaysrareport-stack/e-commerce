import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'kh';

interface TranslationProviderProps {
  children: ReactNode;
}

const translations = {
  en: {
    appName: 'Angkor Express Hub',
    dashboard: 'Dashboard',
    adminPanel: 'Admin Panel',
    sellerPanel: 'Seller Portal',
    deliveryPanel: 'Delivery Portal',
    shop: 'Shop Market',
    language: 'Language',
    login: 'Sign In',
    logout: 'Log Out',
    register: 'Create Account',
    cart: 'Shopping Cart',
    checkout: 'Checkout',
    total: 'Total',
    status: 'Status',
    actions: 'Actions',
    users: 'Users',
    products: 'Products',
    orders: 'Orders',
    delivery: 'Delivery Logistics',
    revenue: 'Total Revenue',
    stock: 'In Stock',
    category: 'Category',
    add: 'Add New',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save Changes',
    ban: 'Restrict (Ban)',
    unban: 'Restore (Unban)',
    all: 'All',
    search: 'Search items...',
    addToCart: 'Add to Cart',
    checkoutSuccess: 'Order Placed Successfully!',
    paymentMethod: 'Payment Option',
    bakongQR: 'Bakong Scan & Pay (KHQR)',
    cashOnDelivery: 'Cash on Delivery (COD)',
    phone: 'Phone Number',
    address: 'Delivery Address',
    name: 'Full Name',
    email: 'Email Address',
    password: 'Password',
    role: 'Platform Role',
    active: 'Active',
    banned: 'Suspended',
    exportTxt: 'Export Orders (.txt)',
    orderedAt: 'Ordered At',
    assignDriver: 'Assign Rider',
    unassigned: 'Unassigned',
    quickFill: 'Quick Fill (Testing Accounts)',
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    pickedUp: 'Picked Up',
    delivering: 'Out for Delivery',
    ownRevenue: 'Own Revenue Stream',
    ownProducts: 'My Listed Products',
    ownOrders: 'My Sales Orders',
    cartEmpty: 'Your basket is currently empty.',
    checkoutModalTitle: 'Bakong KHQR Payment',
    checkoutModalDesc: 'Please scan the KHQR code below to submit your payment. Your balance will sync instantly.',
    scanCompleted: 'Finish Checkout & Place Order',
    driverDashboard: 'Rider Operations Desk',
    driverName: 'Driver Name',
    driverList: 'Active Delivery Riders'
  },
  kh: {
    appName: 'ផ្សារ អង្គរ អិចប្រេស',
    dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    adminPanel: 'បន្ទះគ្រប់គ្រងទូទៅ',
    sellerPanel: 'មជ្ឈមណ្ឌលអ្នកលក់',
    deliveryPanel: 'សេវាកម្មដឹកជញ្ជូន',
    shop: 'ទំព័រដើមហាង',
    language: 'ភាសា',
    login: 'ចូលគណនី',
    logout: 'ចាកចេញ',
    register: 'ចុះឈ្មោះគណនី',
    cart: 'កន្ត្រកទិញទំនិញ',
    checkout: 'បង់ប្រាក់',
    total: 'សរុប',
    status: 'ស្ថានភាព',
    actions: 'សកម្មភាព',
    users: 'អ្នកប្រើប្រាស់',
    products: 'ផលិតផល',
    orders: 'ការបញ្ជាទិញ',
    delivery: 'សេវាដឹកជញ្ជូន',
    revenue: 'ចំណូលសរុប',
    stock: 'ចំនួនក្នុងស្តុក',
    category: 'ប្រភេទផលិតផល',
    add: 'បន្ថែមថ្មី',
    edit: 'កែសម្រួល',
    delete: 'លុបចោល',
    cancel: 'បោះបង់',
    save: 'រក្សាទុក',
    ban: 'ផ្អាកគណនី (Ban)',
    unban: 'បើកគណនីឡើងវិញ (Unban)',
    all: 'ទាំងអស់',
    search: 'ស្វែងរកទំនិញ...',
    addToCart: 'ដាក់ក្នុងកន្ត្រក',
    checkoutSuccess: 'ការបញ្ជាទិញបានសម្រេច!',
    paymentMethod: 'វិធីសាស្ត្របង់ប្រាក់',
    bakongQR: 'ស្កែនឃ្យូអរកូដបាគង (KHQR)',
    cashOnDelivery: 'ទូទាត់ពេលទំនិញមកដល់ (COD)',
    phone: 'លេខទូរស័ព្ទ',
    address: 'អាសយដ្ឋានដឹកជញ្ជូន',
    name: 'ឈ្មោះពេញ',
    email: 'អាសយដ្ឋានអ៊ីមែល',
    password: 'លេខសម្ងាត់',
    role: 'តួនាទីគណនី',
    active: 'សកម្ម',
    banned: 'ត្រូវបានផ្អាក',
    exportTxt: 'ទាញយករបាយការណ៍ (.txt)',
    orderedAt: 'កាលបរិច្ឆេទបញ្ជាទិញ',
    assignDriver: 'ចាត់តាំងអ្នកដឹក',
    unassigned: 'មិនទាន់ចាត់តាំង',
    quickFill: 'គណនីសាកល្បងរហ័ស',
    pending: 'រង់ចាំពិនិត្យ',
    processing: 'កំពុងរៀបចំ',
    shipped: 'បានផ្ញើចេញ',
    delivered: 'បានប្រគល់ជោគជ័យ',
    cancelled: 'បានបោះបង់',
    pickedUp: 'បានទទួលឥវ៉ាន់',
    delivering: 'កំពុងដឹកជញ្ជូន',
    ownRevenue: 'ប្រាក់ចំណូលលក់',
    ownProducts: 'ផលិតផលរបស់ខ្ញុំ',
    ownOrders: 'ការកម្មង់របស់ខ្ញុំ',
    cartEmpty: 'មិនទាន់មានទំនិញក្នុងកន្ត្រកឡើយ។',
    checkoutModalTitle: 'ការបង់ប្រាក់តាម បាគង KHQR',
    checkoutModalDesc: 'សូមស្កែនរូបភាព KHQR ខាងក្រោមដើម្បីបញ្ចប់ការទិញទំនិញ។ ប្រព័ន្ធនឹងធ្វើការបញ្ជាក់ភ្លាមៗ។',
    scanCompleted: 'បញ្ចប់ការស្កែន និងកម្មង់ឥឡូវនេះ',
    driverDashboard: 'ផ្ទាំងគ្រប់គ្រងបុគ្គលិកដឹកជញ្ជូន',
    driverName: 'ឈ្មោះអ្នកដឹក',
    driverList: 'អ្នកដឹកជញ្ជូនសកម្ម'
  }
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations['en']): string => {
    return translations[language][key] || translations['en'][key] || String(key);
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
