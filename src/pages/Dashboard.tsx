import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Clock,
  Users,
  CreditCard,
  Receipt,
  Zap,
  TrendingUp,
  ArrowRight,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import type { QueueStats, Order, ConsumptionRecord } from '../../shared/types';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const currentQuota = useAppStore((state) => state.currentQuota);
  const setCurrentQuota = useAppStore((state) => state.setCurrentQuota);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentConsumption, setRecentConsumption] = useState<ConsumptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  const loadData = async () => {
    try {
      const [stats, orders, consumption, quota] = await Promise.all([
        api.queue.getStats(),
        api.queue.getUserOrders(currentUser!.id, 5),
        api.consumption.getUser(currentUser!.id, 5),
        api.quota.get(currentUser!.id),
      ]);
      setQueueStats(stats);
      setRecentOrders(orders);
      setRecentConsumption(consumption);
      setCurrentQuota(quota);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: '点餐取号', icon: UtensilsCrossed, path: '/order', color: 'bg-primary-500' },
    { label: '查看队列', icon: Clock, path: '/queue', color: 'bg-secondary-500' },
    { label: '我的额度', icon: CreditCard, path: '/quota', color: 'bg-green-500' },
    { label: '消费明细', icon: Receipt, path: '/consumption', color: 'bg-purple-500' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <span className="badge badge-warning">等待中</span>;
      case 'calling':
        return <span className="badge badge-primary animate-pulse">叫号中</span>;
      case 'completed':
        return <span className="badge badge-success">已完成</span>;
      case 'cancelled':
        return <span className="badge badge-danger">已取消</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm">欢迎回来</p>
              <h2 className="text-2xl font-bold mt-1 flex items-center gap-2">
                {currentUser?.name}
                {currentUser?.role === 'vip' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-400 text-yellow-900 rounded-full text-xs font-medium">
                    <Crown className="w-3 h-3" />
                    VIP
                  </span>
                )}
              </h2>
              <p className="text-white/70 text-sm mt-1">{currentUser?.department}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">本月餐补</p>
              <p className="text-3xl font-bold mt-1">
                ¥{currentQuota?.remainingAmount.toFixed(2) || '0.00'}
              </p>
              <p className="text-white/70 text-xs">
                总额度 ¥{currentQuota?.monthlyAmount.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          {currentQuota && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/80">额度使用进度</span>
                <span>{Math.round((currentQuota.usedAmount / currentQuota.monthlyAmount) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((currentQuota.usedAmount / currentQuota.monthlyAmount) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">等待人数</p>
              <p className="text-2xl font-bold text-gray-800">{queueStats?.waitingCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">平均等待</p>
              <p className="text-2xl font-bold text-gray-800">{queueStats?.avgWaitTime || 0} 分钟</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日完成</p>
              <p className="text-2xl font-bold text-gray-800">{queueStats?.todayCompleted || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">当前叫号</p>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                {queueStats?.currentCalling
                  ? String(queueStats.currentCalling.ticketNumber).padStart(3, '0')
                  : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Calling */}
      {queueStats?.currentCalling && (
        <div className="card p-6 border-2 border-primary-300 bg-primary-50/50">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white animate-pulse-slow">
              <span className="text-4xl font-bold font-mono">
                {String(queueStats.currentCalling.ticketNumber).padStart(3, '0')}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-primary animate-bounce-slow">正在叫号</span>
                <span className="text-gray-500 text-sm">{queueStats.currentCalling.stallName}</span>
              </div>
              <p className="text-xl font-semibold text-gray-800">{queueStats.currentCalling.userName}</p>
              <p className="text-gray-500">请前往取餐</p>
            </div>
            <button
              onClick={() => navigate('/queue')}
              className="btn-outline flex items-center gap-2"
            >
              查看队列
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="card p-5 text-left card-hover group"
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110', action.color)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-800">{action.label}</p>
                <div className="flex items-center text-sm text-gray-500 mt-1 group-hover:text-primary-600 transition-colors">
                  立即前往
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">我的订单</h3>
            <button
              onClick={() => navigate('/queue')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>暂无订单</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/queue')}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center font-mono font-bold text-primary-600">
                      {String(order.ticketNumber).padStart(3, '0')}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{order.stallName}</p>
                      <p className="text-sm text-gray-500">
                        {order.items.map((i) => `${i.name}×${i.quantity}`).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">¥{order.totalAmount.toFixed(2)}</p>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">最近消费</h3>
            <button
              onClick={() => navigate('/consumption')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentConsumption.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>暂无消费记录</p>
              </div>
            ) : (
              recentConsumption.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      record.paymentMethod === 'quota' ? 'bg-green-100' : 'bg-orange-100'
                    )}>
                      {record.paymentMethod === 'quota' ? (
                        <CreditCard className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{record.stallName}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">{record.items}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">-¥{record.amount.toFixed(2)}</p>
                    <span className={cn(
                      'text-xs',
                      record.paymentMethod === 'quota' ? 'text-green-600' : 'text-orange-600'
                    )}>
                      {record.paymentMethod === 'quota' ? '餐补支付' : record.paymentMethod === 'mixed' ? '混合支付' : '自费'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
