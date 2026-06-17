import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Wallet,
  Receipt,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import type { Quota, ConsumptionRecord } from '../../shared/types';
import { cn } from '../lib/utils';

export default function QuotaPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentQuota = useAppStore((state) => state.setCurrentQuota);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [history, setHistory] = useState<ConsumptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadData();
  }, [currentUser, navigate, selectedMonth]);

  const loadData = async () => {
    try {
      const [quotaData, historyData] = await Promise.all([
        api.quota.get(currentUser.id),
        api.consumption.getUser(currentUser.id, 10),
      ]);
      setQuota(quotaData);
      setCurrentQuota(quotaData);
      setHistory(historyData);
    } catch (e) {
      console.error('Failed to load quota:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUsagePercentage = () => {
    if (!quota) return 0;
    return Math.min((quota.usedAmount / quota.monthlyAmount) * 100, 100);
  };

  const getUsageStatus = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return { color: 'text-red-500', bg: 'bg-red-500', label: '额度即将用完', icon: AlertCircle };
    if (percentage >= 70) return { color: 'text-yellow-500', bg: 'bg-yellow-500', label: '使用较多', icon: TrendingDown };
    return { color: 'text-green-500', bg: 'bg-green-500', label: '使用正常', icon: CheckCircle };
  };

  const getPaymentMethodLabel = (method: string) => {
    if (method === 'quota') return { label: '餐补', color: 'bg-green-100 text-green-700' };
    if (method === 'self_pay') return { label: '自费', color: 'bg-orange-100 text-orange-700' };
    return { label: '混合', color: 'bg-blue-100 text-blue-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const status = getUsageStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Main Quota Card */}
      <div className="card p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">我的额度</h2>
              <p className="text-sm opacity-80">{quota?.month || selectedMonth} 月度餐补</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">剩余额度</p>
            <p className="text-4xl font-bold">¥{quota?.remainingAmount.toFixed(2) || '0.00'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">月度总额</p>
            <p className="text-2xl font-semibold">¥{quota?.monthlyAmount.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-80">已使用 ¥{quota?.usedAmount.toFixed(2) || '0.00'}</span>
            <span className="flex items-center gap-1">
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', status.bg)}
              style={{ width: `${getUsagePercentage()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs opacity-70">
            <span>0%</span>
            <span>{getUsagePercentage().toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Status */}
        {quota && quota.remainingAmount <= 0 && (
          <div className="mt-4 p-3 bg-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>本月额度已用完，后续消费将转为自费</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">餐补消费</p>
              <p className="text-xl font-bold text-gray-800">
                ¥{history.filter((h) => h.quotaUsed > 0).reduce((sum, h) => sum + h.quotaUsed, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">自费金额</p>
              <p className="text-xl font-bold text-gray-800">
                ¥{history.reduce((sum, h) => sum + h.selfPayAmount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">查看月份</span>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Notice */}
      <div className="card p-5 bg-yellow-50 border border-yellow-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">额度说明</p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• 每月1日自动重置额度，上月剩余额度不累加</li>
              <li>• 消费优先使用餐补额度，超出部分自动转为自费</li>
              <li>• 每月额度标准由公司统一制定，如有调整请联系行政部</li>
              <li>• 退单时已使用的餐补额度将按比例退回</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Consumption */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">近期消费记录</h3>
        {history.length === 0 ? (
          <div className="card p-12 text-center">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">暂无消费记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => {
              const paymentInfo = getPaymentMethodLabel(record.paymentMethod);
              return (
                <div key={record.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{record.stallName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', paymentInfo.color)}>
                            {paymentInfo.label}
                          </span>
                          {record.quotaUsed > 0 && (
                            <span className="text-xs text-green-600">
                              餐补 ¥{record.quotaUsed.toFixed(2)}
                            </span>
                          )}
                          {record.selfPayAmount > 0 && (
                            <span className="text-xs text-orange-600">
                              自费 ¥{record.selfPayAmount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">¥{record.amount.toFixed(2)}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(record.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
