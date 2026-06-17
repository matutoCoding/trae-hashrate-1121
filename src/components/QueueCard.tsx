import { Clock, User, Crown, Zap } from 'lucide-react';
import type { QueueItem } from '../../shared/types';
import { cn } from '../lib/utils';

interface QueueCardProps {
  item: QueueItem;
  isCalling?: boolean;
  onComplete?: () => void;
}

export default function QueueCard({ item, isCalling, onComplete }: QueueCardProps) {
  const getPriorityIcon = () => {
    if (item.priority === 'urgent') {
      return <Zap className="w-4 h-4 text-red-500" />;
    }
    if (item.priority === 'vip') {
      return <Crown className="w-4 h-4 text-yellow-500" />;
    }
    return null;
  };

  const getPriorityLabel = () => {
    switch (item.priority) {
      case 'urgent':
        return '加急';
      case 'vip':
        return 'VIP';
      default:
        return '普通';
    }
  };

  const getPriorityClass = () => {
    switch (item.priority) {
      case 'urgent':
        return 'badge-danger';
      case 'vip':
        return 'badge-accent';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusClass = () => {
    if (item.status === 'calling') {
      return 'border-primary-500 bg-primary-50 ring-2 ring-primary-200';
    }
    if (item.priority === 'urgent') {
      return 'border-red-200 bg-red-50/50';
    }
    if (item.priority === 'vip') {
      return 'border-yellow-200 bg-yellow-50/50';
    }
    return 'border-gray-200';
  };

  return (
    <div
      className={cn(
        'card p-4 border-2 transition-all duration-300',
        getStatusClass(),
        isCalling && 'animate-pulse-slow'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('text-2xl font-bold font-mono', item.status === 'calling' ? 'text-primary-600' : 'text-gray-800')}>
            {String(item.ticketNumber).padStart(3, '0')}
          </span>
          <span className={cn('badge', getPriorityClass(), 'flex items-center gap-1')}>
            {getPriorityIcon()}
            {getPriorityLabel()}
          </span>
          {item.status === 'calling' && (
            <span className="badge badge-primary animate-bounce-slow">叫号中</span>
          )}
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500">位置</span>
          <span className="ml-2 text-xl font-bold text-gray-800">#{item.queuePosition}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-700">{item.userName}</span>
        </div>
        <div className="text-sm text-gray-500">
          {item.stallName}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          预计等待 {item.estimatedWaitTime} 分钟
        </div>
        <span className="font-semibold text-primary-600">¥{item.totalAmount.toFixed(2)}</span>
      </div>

      {isCalling && onComplete && (
        <button
          onClick={onComplete}
          className="w-full mt-3 btn-primary"
        >
          完成取餐
        </button>
      )}
    </div>
  );
}
