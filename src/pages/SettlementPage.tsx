import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  RefreshCw,
  Calendar,
  Store,
  TrendingUp,
  DollarSign,
  Percent,
  CreditCard,
  FileText,
  CheckCircle,
  Clock,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import type { Settlement, Stall } from '../../shared/types';
import { cn } from '../lib/utils';

export default function SettlementPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !['admin', 'stall_admin'].includes(currentUser.role)) {
      navigate('/login');
      return;
    }
    loadData();
  }, [currentUser, navigate, selectedDate, selectedStallId]);

  const loadData = async () => {
    try {
      const [stallsData, settlementsData] = await Promise.all([
        api.stall.getAll(),
        api.consumption.getSettlements(selectedDate),
      ]);
      setStalls(stallsData);
      let filtered = settlementsData;
      if (selectedStallId) {
        filtered = settlementsData.filter((s: Settlement) => s.stallId === selectedStallId);
      }
      setSettlements(filtered);
    } catch (e) {
      console.error('Failed to load settlements:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    if (status === 'settled') return { label: '已结算', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    return { label: '待结算', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
  };

  const totalStats = {
    totalOrders: settlements.reduce((sum, s) => sum + s.totalOrders, 0),
    totalAmount: settlements.reduce((sum, s) => sum + s.totalAmount, 0),
    totalSettlement: settlements.reduce((sum, s) => sum + s.settlementAmount, 0),
    totalCommission: settlements.reduce((sum, s) => sum + s.commissionAmount, 0),
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
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">档口结算</h2>
              <p className="text-sm text-gray-500">查看档口营收和分账统计</p>
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
              <FileText className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-500">订单总数</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalStats.totalOrders}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-blue-600">总营收</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">¥{totalStats.totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <p className="text-sm text-green-600">结算金额</p>
            </div>
            <p className="text-2xl font-bold text-green-600">¥{totalStats.totalSettlement.toFixed(2)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-orange-400" />
              <p className="text-sm text-orange-600">抽成金额</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">¥{totalStats.totalCommission.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedStallId || ''}
              onChange={(e) => setSelectedStallId(e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部档口</option>
              {stalls.map((stall) => (
                <option key={stall.id} value={stall.id}>{stall.name}</option>
              ))}
            </select>
          </div>

          {currentUser?.role === 'admin' && (
            <button className="btn-secondary flex items-center gap-2 ml-auto">
              <Download className="w-4 h-4" />
              导出报表
            </button>
          )}
        </div>
      </div>

      {/* Settlement List */}
      {settlements.length === 0 ? (
        <div className="card p-12 text-center">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">暂无结算记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map((settlement) => {
            const statusInfo = getStatusLabel(settlement.status);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === settlement.id;
            return (
              <div key={settlement.id} className="card overflow-hidden">
                {/* Main Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : settlement.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Store className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-800">{settlement.stallName}</span>
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusInfo.color)}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {settlement.totalOrders} 单
                          </span>
                          <span className="flex items-center gap-1">
                            <Percent className="w-4 h-4" />
                            抽成 {(settlement.commissionRate * 100).toFixed(0)}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(settlement.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 ml-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">总营收</p>
                        <p className="text-lg font-bold text-gray-800">¥{settlement.totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-orange-500">抽成</p>
                        <p className="text-lg font-bold text-orange-500">-¥{settlement.commissionAmount.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-500">结算金额</p>
                        <p className="text-xl font-bold text-green-600">¥{settlement.settlementAmount.toFixed(2)}</p>
                      </div>
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
                    <div className="pt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">结算编号</p>
                        <p className="font-mono text-sm text-gray-700">{settlement.id}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 mb-1">总营收金额</p>
                        <p className="font-semibold text-blue-700 text-lg">¥{settlement.totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-orange-600 mb-1">抽成金额 ({(settlement.commissionRate * 100).toFixed(0)}%)</p>
                        <p className="font-semibold text-orange-700 text-lg">¥{settlement.commissionAmount.toFixed(2)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 mb-1">应结算金额</p>
                        <p className="font-semibold text-green-700 text-lg">¥{settlement.settlementAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      {currentUser?.role === 'admin' && settlement.status === 'pending' && (
                        <button
                          className="btn-primary flex items-center gap-2"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`确定要结算 ${settlement.stallName} 的 ¥${settlement.settlementAmount.toFixed(2)} 吗？`)) {
                              try {
                                await api.consumption.confirmSettlement(settlement.id);
                                alert('结算成功');
                                loadData();
                              } catch (err: any) {
                                alert('结算失败: ' + (err.message || '未知错误'));
                              }
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          确认结算
                        </button>
                      )}
                      <button
                        className="btn-secondary flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('导出功能开发中');
                        }}
                      >
                        <Download className="w-4 h-4" />
                        导出明细
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Settlement Explanation */}
      <div className="card p-5 bg-indigo-50 border border-indigo-100">
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-indigo-800">结算说明</p>
            <ul className="text-sm text-indigo-700 mt-2 space-y-1">
              <li>• 结算周期：每日自动生成前一日的结算记录</li>
              <li>• 抽成比例：默认10%，不同档口可能有差异</li>
              <li>• 计算公式：结算金额 = 总营收 × (1 - 抽成比例)</li>
              <li>• 结算状态：待结算 → 管理员确认 → 已结算</li>
              <li>• 结算款项：每月10日统一支付上月已确认的结算金额</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
