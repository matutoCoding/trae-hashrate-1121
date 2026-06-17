import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  RefreshCw,
  Calendar,
  Store,
  CreditCard,
  Wallet,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import type { ConsumptionRecord } from '../../shared/types';
import { cn } from '../lib/utils';

export default function ConsumptionPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const [records, setRecords] = useState<ConsumptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState<'all' | 'quota' | 'self_pay' | 'mixed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadData();
  }, [currentUser, navigate, selectedMonth, filterType]);

  const loadData = async () => {
    try {
      let data = await api.consumption.getUser(currentUser.id, 50);
      if (filterType !== 'all') {
        data = data.filter((r: ConsumptionRecord) => r.paymentMethod === filterType);
      }
      setRecords(data);
    } catch (e) {
      console.error('Failed to load consumption records:', e);
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

  const formatDate = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    if (method === 'quota') return { label: '餐补', color: 'bg-green-100 text-green-700' };
    if (method === 'self_pay') return { label: '自费', color: 'bg-orange-100 text-orange-700' };
    return { label: '混合', color: 'bg-blue-100 text-blue-700' };
  };

  const filteredRecords = records.filter(
    (r) =>
      r.stallName.includes(searchTerm) ||
      r.items.includes(searchTerm)
  );

  const stats = {
    total: records.reduce((sum, r) => sum + r.amount, 0),
    quotaUsed: records.reduce((sum, r) => sum + r.quotaUsed, 0),
    selfPay: records.reduce((sum, r) => sum + r.selfPayAmount, 0),
    count: records.length,
  };

  const groupedRecords = filteredRecords.reduce((groups, record) => {
    const date = formatDate(record.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {} as Record<string, ConsumptionRecord[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">消费明细</h2>
              <p className="text-sm text-gray-500">查看您的所有消费记录</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-500">消费笔数</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.count}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-blue-600">总消费</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">¥{stats.total.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-green-400" />
              <p className="text-sm text-green-600">餐补支付</p>
            </div>
            <p className="text-2xl font-bold text-green-600">¥{stats.quotaUsed.toFixed(2)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-orange-400" />
              <p className="text-sm text-orange-600">自费支付</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">¥{stats.selfPay.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-1">
              {(['all', 'quota', 'self_pay', 'mixed'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    filterType === type
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {type === 'all' ? '全部' : type === 'quota' ? '餐补' : type === 'self_pay' ? '自费' : '混合'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索档口或菜品"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Records List */}
      {Object.keys(groupedRecords).length === 0 ? (
        <div className="card p-12 text-center">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">暂无消费记录</p>
        </div>
      ) : (
        Object.entries(groupedRecords).map(([date, dayRecords]) => (
          <div key={date} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-500 px-3">{date}</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Day Records */}
            <div className="space-y-3">
              {dayRecords.map((record) => {
                const paymentInfo = getPaymentMethodLabel(record.paymentMethod);
                const isExpanded = expandedId === record.id;
                return (
                  <div key={record.id} className="card overflow-hidden">
                    {/* Main Row */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Store className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-800">{record.stallName}</span>
                              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', paymentInfo.color)}>
                                {paymentInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 truncate">{record.items}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {formatTime(record.createdAt)}
                              {record.quotaUsed > 0 && (
                                <span className="text-green-600">餐补 ¥{record.quotaUsed.toFixed(2)}</span>
                              )}
                              {record.selfPayAmount > 0 && (
                                <span className="text-orange-600">自费 ¥{record.selfPayAmount.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="text-xl font-bold text-gray-800">¥{record.amount.toFixed(2)}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="pt-4 grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-500 mb-1">订单编号</p>
                            <p className="font-mono text-sm text-gray-700">{record.orderId}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-500 mb-1">消费时间</p>
                            <p className="text-sm text-gray-700">{formatTime(record.createdAt)}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-sm text-green-600 mb-1">餐补支付</p>
                            <p className="font-semibold text-green-700">¥{record.quotaUsed.toFixed(2)}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3">
                            <p className="text-sm text-orange-600 mb-1">自费支付</p>
                            <p className="font-semibold text-orange-700">¥{record.selfPayAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-500 mb-1">消费明细</p>
                          <p className="text-sm text-gray-700">{record.items}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Export Notice */}
      <div className="card p-5 bg-gray-50 border border-gray-200">
        <div className="flex items-start gap-3">
          <Receipt className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-700">消费明细说明</p>
            <ul className="text-sm text-gray-500 mt-2 space-y-1">
              <li>• 消费记录实时更新，点击记录可查看详细信息</li>
              <li>• 餐补支付优先使用当月额度，额度不足部分自动转为自费</li>
              <li>• 如需报销凭证，请联系行政部门开具</li>
              <li>• 退单记录会显示负数金额，并退回相应的餐补额度</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
