import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from '../context/TranslationContext.js';
import { useNotification } from '../components/Notification.js';
import api from '../services/api.js';
import { Order, Delivery } from '../types.js';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  ClipboardCheck, 
  PackageCheck,
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DeliveryPortal() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  // Shipments state
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter tab
  const [activeTab, setActiveTab] = useState<'my' | 'open'>('my');

  const fetchLogistics = async () => {
    setLoading(true);
    try {
      // Fetch deliverable items
      const delRes = await api.get('/api/delivery');
      setDeliveries(delRes.data);

      // Fetch corresponding order details
      const ordRes = await api.get('/api/orders');
      setOrders(ordRes.data);
    } catch (err) {
      showNotification('Could not load shipping checkpoints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
  }, [activeTab]);

  // Split deliveries: assigned to me vs unassigned
  const myDeliveries = deliveries.filter(d => d.driverId === user?.id);
  const openDeliveries = deliveries.filter(d => !d.driverId || d.driverId === '');

  // Accept/Claim an unassigned delivery runoff
  const handleClaimDelivery = async (orderId: string) => {
    try {
      await api.put(`/api/delivery/${orderId}`, {
        driverId: user?.id,
        status: 'Picked Up'
      });
      showNotification('You have claimed this delivery shipment! Go pick up the package.', 'success');
      fetchLogistics();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to claim cargo', 'error');
    }
  };

  // Change delivery shipping code statuses
  const handleUpdateShippingStatus = async (orderId: string, status: any) => {
    try {
      await api.put(`/api/delivery/${orderId}`, { status });
      showNotification(`Package shipment state updated to ${status.toUpperCase()}`, 'success');
      fetchLogistics();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to update tracking', 'error');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            {t('driverDashboard')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Claim local orders, update shipping stages, and coordinate transactions.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2.5 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('my')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'my' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>My Assigned Jobs ({myDeliveries.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('open')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'open' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Open Packages ({openDeliveries.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col justify-center items-center bg-white rounded-3xl border border-slate-100">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-400 text-xs font-mono">Syncing GPS logs...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MY ACTIVE JOBS RUNS */}
          {activeTab === 'my' && (
            <div className="space-y-6">
              {myDeliveries.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl py-14 text-center px-6">
                  <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700">No active shipping runs allocated</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Click "Open Packages" above to browse new unallocated shipping routes in Phnom Penh.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myDeliveries.map((del) => {
                    const orderDetail = orders.find(o => o.id === del.orderId);
                    if (!orderDetail) return null;

                    return (
                      <div
                        key={del.id}
                        className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-5 flex flex-col justify-between"
                      >
                        {/* Header ID/Status */}
                        <div className="space-y-1.5 pb-3 border-b border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-slate-800 text-sm">{del.orderId}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              del.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : del.status === 'Delivering'
                                ? 'bg-indigo-100 text-indigo-800'
                                : del.status === 'Picked Up'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {del.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Refreshed: {new Date(del.updatedAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Customer profile address info */}
                        <div className="space-y-3 flex-grow">
                          <div className="flex items-start gap-2 text-xs">
                            <MapPin className="w-4 h-4 text-rose-550 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-800 font-bold block">{orderDetail.customerName}</strong>
                              <span className="text-slate-450 leading-relaxed font-semibold">{orderDetail.customerAddress}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-600 font-mono font-semibold">{orderDetail.customerPhone}</span>
                          </div>

                          <hr className="border-slate-50" />

                          {/* Item Manifest previews */}
                          <div className="space-y-1 text-[11px] font-semibold text-slate-500">
                            {orderDetail.products.map(p => (
                              <div key={p.id} className="flex justify-between">
                                <span>{p.qty}x • {p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Status updates buttons */}
                        <div className="pt-3 border-t border-slate-150 space-y-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Update Location Pin:</span>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleUpdateShippingStatus(del.orderId, 'Picked Up')}
                              className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${
                                del.status === 'Picked Up'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              Picked Up
                            </button>
                            <button
                              onClick={() => handleUpdateShippingStatus(del.orderId, 'Delivering')}
                              className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${
                                del.status === 'Delivering'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              Delivering
                            </button>
                            <button
                              onClick={() => handleUpdateShippingStatus(del.orderId, 'Delivered')}
                              className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all ${
                                del.status === 'Delivered'
                                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              Delivered
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE RECRUITMENT OPEN RUNS */}
          {activeTab === 'open' && (
            <div className="space-y-6">
              {openDeliveries.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl py-14 text-center px-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-450 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700">All local packages are accounted for</h4>
                  <p className="text-xs text-slate-405 max-w-xs mx-auto mt-1">Excellent job! Currently there are no unallocated shipping routes pending couriers in the system.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {openDeliveries.map((del) => {
                    const ordObj = orders.find(o => o.id === del.orderId);
                    if (!ordObj) return null;

                    return (
                      <div
                        key={del.id}
                        className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono font-black text-slate-800 text-sm">{del.orderId}</span>
                            <span className="inline-block py-0.5 px-2 bg-amber-50 text-amber-700 font-bold rounded-md font-mono text-[9px] animate-pulse">Pending Rider</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">Invoice Sum: ${ordObj.total.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-800 font-bold block">{ordObj.customerName}</strong>
                              <span className="text-slate-500 font-semibold">{ordObj.customerAddress}</span>
                            </div>
                          </div>
                        </div>

                        {/* Assign yourself button */}
                        <button
                          onClick={() => handleClaimDelivery(del.orderId)}
                          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow hover:bg-indigo-700 transition-all flex justify-center items-center gap-1.5 cursor-pointer mt-2"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>Accept & Claim Job</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
