import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationMessage {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextProps {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const showNotification = (message: string, type: NotificationType = 'success') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto-remove notification after 4.5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Visual rendering container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50 }}
              className={`p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-start gap-3 transition-colors ${
                n.type === 'success'
                  ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200'
                  : n.type === 'error'
                  ? 'bg-rose-50/90 text-rose-900 border-rose-200'
                  : 'bg-blue-50/90 text-blue-900 border-blue-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                {n.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {n.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
              </div>
              <p className="text-sm font-medium flex-grow pr-1">{n.message}</p>
              <button
                onClick={() => removeNotification(n.id)}
                className="hover:bg-black/5 rounded p-0.5 -mt-0.5 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-black" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used inside a NotificationProvider');
  }
  return context;
}
