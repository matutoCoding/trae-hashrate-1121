import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Store,
  Clock,
  Crown,
  Zap,
  Users,
  CreditCard,
  AlertCircle,
  ShoppingCart,
  X,
  Check,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import type { Stall, MenuItem, Order, OrderPriority } from '../../shared/types';
import { cn } from '../lib/utils';
import MenuCard from '../components/MenuCard';

export default function OrderPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const currentQuota = useAppStore((state) => state.currentQuota);
  const setCurrentQuota = useAppStore((state) => state.setCurrentQuota);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [priority, setPriority] = useState<OrderPriority>('normal');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadStalls();
  }, [currentUser, navigate]);

  const loadStalls = async () => {
    try {
      const data = await api.stall.getAll();
      setStalls(data);
    } catch (e) {
      console.error('Failed to load stalls:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectStall = async (stall: Stall) => {
    setSelectedStall(stall);
    setCart({});
    try {
      const menu = await api.stall.getMenu(stall.id);
      setMenuItems(menu);
    } catch (e) {
      console.error('Failed to load menu:', e);
    }
  };

  const addToCart = (menuItemId: string) => {
    setCart((prev) => ({
      ...prev,
      [menuItemId]: (prev[menuItemId] || 0) + 1,
    }));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[menuItemId] > 1) {
        newCart[menuItemId]--;
      } else {
        delete newCart[menuItemId];
      }
      return newCart;
    });
  };

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalAmount = menuItems.reduce((sum, item) => {
    return sum + item.price * (cart[item.id] || 0);
  }, 0);

  const quotaUsed = currentQuota
    ? Math.min(currentQuota.remainingAmount, totalAmount)
    : 0;
  const selfPayAmount = Math.max(0, totalAmount - quotaUsed);

  const canUseVIP = currentUser?.role === 'vip';

  const handleSubmit = async () => {
    if (!selectedStall || totalItems === 0 || !currentUser) return;

    setSubmitting(true);
    try {
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }));

      const order = await api.queue.createTicket({
        userId: currentUser.id,
        stallId: selectedStall.id,
        items,
        priority,
      });

      const quota = await api.quota.get(currentUser.id);
      setCurrentQuota(quota);
      setSuccessOrder(order);
      setShowConfirm(false);
    } catch (e) {
      console.error('Failed to submit order:', e);
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetOrder = () => {
    setCart({});
    setPriority('normal');
    setSuccessOrder(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (successOrder) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">取号成功！</h2>
          <p className="text-gray-500 mb-6">您的订单已提交，请等待叫号</p>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="text-6xl font-bold font-mono text-primary-600 mb-2">
              {String(successOrder.ticketNumber).padStart(3, '0')}
            </div>
            <p className="text-gray-500">{successOrder.stallName}</p>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div>
                <p className="text-gray-500">排队位置</p>
                <p className="font-bold text-gray-800">#{successOrder.queuePosition}</p>
              </div>
              <div>
                <p className="text-gray-500">预计等待</p>
                <p className="font-bold text-gray-800">{successOrder.estimatedWaitTime} 分钟</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/queue')}
              className="w-full btn-primary"
            >
              查看队列
            </button>
            <button
              onClick={resetOrder}
              className="w-full btn-outline"
            >
              继续点餐
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stall Selection */}
      {!selectedStall ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">选择档口</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stalls.map((stall) => (
              <button
                key={stall.id}
                onClick={() => selectStall(stall)}
                className="card p-5 text-left card-hover group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Store className="w-7 h-7 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{stall.name}</h3>
                    <p className="text-sm text-gray-500">{stall.type}</p>
                    <p className="text-xs text-gray-400 mt-1">{stall.location}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Selected Stall Header */}
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedStall(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedStall.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedStall.type} · {selectedStall.location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Selection */}
          <div className="card p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">选择优先级</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPriority('normal')}
                className={cn(
                  'p-4 border-2 rounded-xl transition-all text-center',
                  priority === 'normal'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Users className={cn('w-6 h-6 mx-auto mb-2', priority === 'normal' ? 'text-primary-600' : 'text-gray-400')} />
                <p className={cn('font-medium', priority === 'normal' ? 'text-primary-700' : 'text-gray-600')}>普通</p>
                <p className="text-xs text-gray-500 mt-1">按顺序排队</p>
              </button>

              <button
                onClick={() => canUseVIP && setPriority('vip')}
                disabled={!canUseVIP}
                className={cn(
                  'p-4 border-2 rounded-xl transition-all text-center',
                  priority === 'vip'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300',
                  !canUseVIP && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Crown className={cn('w-6 h-6 mx-auto mb-2', priority === 'vip' ? 'text-yellow-600' : 'text-gray-400')} />
                <p className={cn('font-medium', priority === 'vip' ? 'text-yellow-700' : 'text-gray-600')}>VIP</p>
                <p className="text-xs text-gray-500 mt-1">{canUseVIP ? '优先插队' : '仅VIP可用'}</p>
              </button>

              <button
                onClick={() => setPriority('urgent')}
                className={cn(
                  'p-4 border-2 rounded-xl transition-all text-center',
                  priority === 'urgent'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Zap className={cn('w-6 h-6 mx-auto mb-2', priority === 'urgent' ? 'text-red-600' : 'text-gray-400')} />
                <p className={cn('font-medium', priority === 'urgent' ? 'text-red-700' : 'text-gray-600')}>加急</p>
                <p className="text-xs text-gray-500 mt-1">最高优先级</p>
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">选择菜品</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  quantity={cart[item.id] || 0}
                  onAdd={() => addToCart(item.id)}
                  onRemove={() => removeFromCart(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      {selectedStall && totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">合计</p>
                <p className="text-2xl font-bold text-primary-600">¥{totalAmount.toFixed(2)}</p>
              </div>
              {currentQuota && quotaUsed > 0 && (
                <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">餐补支付</p>
                    <p className="text-sm font-medium text-green-600">-¥{quotaUsed.toFixed(2)}</p>
                  </div>
                  {selfPayAmount > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">自费</p>
                      <p className="text-sm font-medium text-orange-600">¥{selfPayAmount.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="btn-primary flex items-center gap-2"
            >
              确认下单
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom padding for fixed bar */}
      {selectedStall && totalItems > 0 && <div className="h-24" />}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full animate-slide-up">
            <h3 className="text-xl font-bold text-gray-800 mb-4">确认订单</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">档口</span>
                <span className="font-medium">{selectedStall?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">优先级</span>
                <span className={cn(
                  'font-medium',
                  priority === 'normal' ? 'text-gray-600' :
                  priority === 'vip' ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {priority === 'normal' ? '普通' : priority === 'vip' ? 'VIP' : '加急'}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3">
                {Object.entries(cart).map(([menuItemId, quantity]) => {
                  const item = menuItems.find((m) => m.id === menuItemId);
                  if (!item) return null;
                  return (
                    <div key={menuItemId} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">
                        {item.name} × {quantity}
                      </span>
                      <span className="font-medium">¥{(item.price * quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">合计</span>
                  <span className="text-xl font-bold text-primary-600">¥{totalAmount.toFixed(2)}</span>
                </div>
                {currentQuota && quotaUsed > 0 && (
                  <>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">餐补支付</span>
                      <span className="text-green-600">-¥{quotaUsed.toFixed(2)}</span>
                    </div>
                    {selfPayAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          自费
                          <AlertCircle className="w-3 h-3 text-orange-500" />
                        </span>
                        <span className="text-orange-600">¥{selfPayAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {currentQuota && currentQuota.remainingAmount < totalAmount && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                  <CreditCard className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    本月餐补剩余 ¥{currentQuota.remainingAmount.toFixed(2)}，
                    超出部分 ¥{selfPayAmount.toFixed(2)} 将自费支付
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>确认取号</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
