import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  Check,
  SkipForward,
  Store,
  Clock,
  Users,
  Crown,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import type { QueueItem, Stall } from '../../shared/types';
import { cn } from '../lib/utils';
import QueueCard from '../components/QueueCard';

export default function CallPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'stall_admin' && currentUser.role !== 'admin') {
      navigate('/');
      return;
    }
    loadStalls();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (selectedStallId) {
      loadQueue();
      const interval = setInterval(loadQueue, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedStallId]);

  const loadStalls = async () => {
    try {
      const data = await api.stall.getAll();
      setStalls(data);
      if (data.length > 0) {
        setSelectedStallId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load stalls:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async () => {
    if (!selectedStallId) return;
    try {
      const data = await api.queue.getQueue(selectedStallId);
      setQueue(data.queue);
    } catch (e) {
      console.error('Failed to load queue:', e);
    }
  };

  const callingItem = queue.find((q) => q.status === 'calling');
  const waitingItems = queue.filter((q) => q.status === 'waiting');

  const handleCallNext = async () => {
    if (!selectedStallId || calling) return;
    setCalling(true);
    try {
      await api.queue.callNext(selectedStallId);
      await loadQueue();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCalling(false);
    }
  };

  const handleComplete = async (orderId: string) => {
    if (completing) return;
    setCompleting(true);
    try {
      await api.queue.complete(orderId);
      await loadQueue();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCompleting(false);
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
      {/* Stall Selection */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stalls.map((stall) => (
          <button
            key={stall.id}
            onClick={() => setSelectedStallId(stall.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all font-medium',
              selectedStallId === stall.id
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <Store className="w-5 h-5" />
            {stall.name}
          </button>
        ))}
      </div>

      {/* Current Calling */}
      <div className="card p-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">当前叫号</h3>

        {callingItem ? (
          <div className="text-center">
            <div className="text-9xl font-bold font-mono text-primary-600 mb-6 animate-pulse-slow">
              {String(callingItem.ticketNumber).padStart(3, '0')}
            </div>
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5" />
                {callingItem.userName}
              </span>
              {callingItem.priority !== 'normal' && (
                <span className={cn(
                  'badge flex items-center gap-1',
                  callingItem.priority === 'vip' ? 'badge-accent' : 'badge-danger'
                )}>
                  {callingItem.priority === 'vip' ? (
                    <Crown className="w-3 h-3" />
                  ) : (
                    <Zap className="w-3 h-3" />
                  )}
                  {callingItem.priority === 'vip' ? 'VIP' : '加急'}
                </span>
              )}
            </div>

            <div className="max-w-sm mx-auto">
              <QueueCard
                item={callingItem}
                isCalling
                onComplete={() => handleComplete(callingItem.orderId)}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Volume2 className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-xl text-gray-600 mb-2">暂无正在叫号的订单</p>
            <p className="text-gray-500">点击下方按钮呼叫下一位</p>
          </div>
        )}
      </div>

      {/* Call Next Button */}
      <button
        onClick={handleCallNext}
        disabled={calling || waitingItems.length === 0 || !!callingItem}
        className="w-full btn-primary py-6 text-xl flex items-center justify-center gap-3"
      >
        {calling ? (
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Volume2 className="w-6 h-6" />
        )}
        {callingItem
          ? '请先完成当前叫号'
          : waitingItems.length === 0
          ? '暂无等待订单'
          : `呼叫下一位 (${waitingItems.length} 人等待)`}
      </button>

      {/* Waiting Queue */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">等待队列</h3>
          <span className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            预计平均等待 {queue.length > 0 ? Math.round(queue.reduce((s, q) => s + q.estimatedWaitTime, 0) / queue.length) : 0} 分钟
          </span>
        </div>

        {waitingItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无等待订单</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitingItems.map((item, index) => (
              <div
                key={item.orderId}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-xl',
                  index === 0
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-white text-gray-600 border border-gray-200'
                )}>
                  {String(item.ticketNumber).padStart(3, '0')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{item.userName}</span>
                    {item.priority === 'vip' && (
                      <span className="badge badge-accent flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        VIP
                      </span>
                    )}
                    {item.priority === 'urgent' && (
                      <span className="badge badge-danger flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        加急
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    金额 ¥{item.totalAmount.toFixed(2)} · 预计等待 {item.estimatedWaitTime} 分钟
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">位置</p>
                  <p className="font-bold text-gray-800">#{item.queuePosition}</p>
                </div>
                {index === 0 && (
                  <button
                    onClick={() => handleCallNext()}
                    disabled={!!callingItem || calling}
                    className="btn-outline py-2 px-4 text-sm"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
