import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  RefreshCw,
  Store,
  User,
  Crown,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import type { QueueItem, QueueStats, Stall } from '../../shared/types';
import { cn } from '../lib/utils';
import QueueCard from '../components/QueueCard';

export default function QueuePage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [currentUser, navigate, selectedStallId]);

  const loadData = async () => {
    try {
      const [queueData, stallsData] = await Promise.all([
        api.queue.getQueue(selectedStallId || undefined),
        api.stall.getAll(),
      ]);
      setQueue(queueData.queue);
      setStats(queueData.stats);
      setStalls(stallsData);
    } catch (e) {
      console.error('Failed to load queue:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const callingItem = queue.find((q) => q.status === 'calling');
  const waitingItems = queue.filter((q) => q.status === 'waiting');

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent') return <Zap className="w-4 h-4 text-red-500" />;
    if (priority === 'vip') return <Crown className="w-4 h-4 text-yellow-500" />;
    return null;
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
      {/* Current Calling Display */}
      <div className="card p-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold opacity-90">当前叫号</h2>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
          </button>
        </div>

        {callingItem ? (
          <div className="text-center">
            <div className="text-8xl font-bold font-mono mb-4 animate-pulse">
              {String(callingItem.ticketNumber).padStart(3, '0')}
            </div>
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Store className="w-4 h-4" />
                {callingItem.stallName}
              </span>
              <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <User className="w-4 h-4" />
                {callingItem.userName}
              </span>
              {getPriorityIcon(callingItem.priority) && (
                <span className="flex items-center gap-1 bg-white/20 px-4 py-2 rounded-full">
                  {getPriorityIcon(callingItem.priority)}
                  {callingItem.priority === 'vip' ? 'VIP' : '加急'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 opacity-80">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">暂无叫号</p>
            <p className="text-sm opacity-70 mt-1">请稍候，下一位即将叫号</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">等待人数</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.waitingCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">平均等待</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.avgWaitTime || 0} 分钟</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日完成</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.todayCompleted || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stall Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedStallId(null)}
          className={cn(
            'px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium',
            selectedStallId === null
              ? 'bg-primary-500 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          全部档口
        </button>
        {stalls.map((stall) => (
          <button
            key={stall.id}
            onClick={() => setSelectedStallId(stall.id)}
            className={cn(
              'px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium',
              selectedStallId === stall.id
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {stall.name}
          </button>
        ))}
      </div>

      {/* Waiting Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">等待队列</h3>
          <span className="text-sm text-gray-500">共 {waitingItems.length} 人等待</span>
        </div>

        {waitingItems.length === 0 ? (
          <div className="card p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">暂无等待订单</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waitingItems.map((item, index) => (
              <div key={item.orderId} className="relative">
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="badge badge-accent flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      下一位
                    </span>
                  </div>
                )}
                <QueueCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
