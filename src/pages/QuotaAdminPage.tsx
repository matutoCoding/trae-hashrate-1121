import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  RefreshCw,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Minus,
  RotateCcw,
  User,
  Crown,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import type { Quota, User as UserType } from '../../shared/types';
import { cn } from '../lib/utils';

interface UserQuota extends UserType {
  quota?: Quota;
}

export default function QuotaAdminPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const [users, setUsers] = useState<UserQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [adjustModal, setAdjustModal] = useState<{ show: boolean; userId: string; userName: string } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadData();
  }, [currentUser, navigate, selectedMonth]);

  const loadData = async () => {
    try {
      const usersData = await api.user.getAll();
      const usersWithQuota: UserQuota[] = [];
      for (const user of usersData) {
        try {
          const quotaData = await api.quota.get(user.id);
          usersWithQuota.push({ ...user, quota: quotaData });
        } catch {
          usersWithQuota.push({ ...user });
        }
      }
      setUsers(usersWithQuota);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleResetAll = async () => {
    if (!confirm('确定要重置所有用户的本月额度吗？此操作不可撤销。')) return;
    try {
      setProcessing(true);
      await api.quota.reset();
      alert('额度重置成功');
      loadData();
    } catch (e: any) {
      alert('重置失败: ' + (e.message || '未知错误'));
    } finally {
      setProcessing(false);
    }
  };

  const handleAdjustQuota = async () => {
    if (!adjustModal || adjustAmount === 0) return;
    try {
      setProcessing(true);
      await api.quota.adjust(adjustModal.userId, adjustAmount);
      alert('额度调整成功');
      setAdjustModal(null);
      setAdjustAmount(0);
      loadData();
    } catch (e: any) {
      alert('调整失败: ' + (e.message || '未知错误'));
    } finally {
      setProcessing(false);
    }
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

  const filteredUsers = users.filter(
    (u) =>
      u.name.includes(searchTerm) ||
      u.employeeId.includes(searchTerm) ||
      u.department.includes(searchTerm)
  );

  const getRoleLabel = (role: string) => {
    if (role === 'vip') return { label: 'VIP员工', color: 'bg-yellow-100 text-yellow-700', icon: Crown };
    if (role === 'admin') return { label: '管理员', color: 'bg-purple-100 text-purple-700', icon: Settings };
    if (role === 'stall_admin') return { label: '档口管理', color: 'bg-orange-100 text-orange-700', icon: User };
    return { label: '普通员工', color: 'bg-gray-100 text-gray-700', icon: User };
  };

  const getUsagePercentage = (quota?: Quota) => {
    if (!quota || quota.monthlyAmount === 0) return 0;
    return Math.min((quota.usedAmount / quota.monthlyAmount) * 100, 100);
  };

  const totalStats = {
    total: users.reduce((sum, u) => sum + (u.quota?.monthlyAmount || 0), 0),
    used: users.reduce((sum, u) => sum + (u.quota?.usedAmount || 0), 0),
    remaining: users.reduce((sum, u) => sum + (u.quota?.remainingAmount || 0), 0),
    count: users.length,
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
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">额度管理</h2>
              <p className="text-sm text-gray-500">管理所有用户的餐补额度</p>
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
            <p className="text-sm text-gray-500">用户总数</p>
            <p className="text-2xl font-bold text-gray-800">{totalStats.count}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">月度总额度</p>
            <p className="text-2xl font-bold text-blue-600">¥{totalStats.total.toFixed(2)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600">已使用</p>
            <p className="text-2xl font-bold text-orange-600">¥{totalStats.used.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">剩余额度</p>
            <p className="text-2xl font-bold text-green-600">¥{totalStats.remaining.toFixed(2)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户姓名、工号或部门"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={handleResetAll}
            disabled={processing}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置本月额度
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">暂无用户数据</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const roleInfo = getRoleLabel(user.role);
            const RoleIcon = roleInfo.icon;
            const usagePercent = getUsagePercentage(user.quota);
            return (
              <div key={user.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">{user.name}</span>
                        <span className="text-sm text-gray-500">({user.employeeId})</span>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', roleInfo.color)}>
                          <RoleIcon className="w-3 h-3" />
                          {roleInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{user.department}</p>

                      {/* Quota Progress */}
                      {user.quota && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">
                              已使用 ¥{user.quota.usedAmount.toFixed(2)} / ¥{user.quota.monthlyAmount.toFixed(2)}
                            </span>
                            <span className="font-medium text-primary-600">
                              剩余 ¥{user.quota.remainingAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              )}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setAdjustModal({ show: true, userId: user.id, userName: user.name })}
                      className="btn-primary flex items-center gap-1 text-sm"
                    >
                      <Settings className="w-4 h-4" />
                      调整额度
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`确定要重置 ${user.name} 的本月额度吗？`)) return;
                        try {
                          await api.quota.reset(user.id);
                          alert('额度重置成功');
                          loadData();
                        } catch (e: any) {
                          alert('重置失败: ' + e.message);
                        }
                      }}
                      className="btn-secondary flex items-center gap-1 text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重置
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Adjust Modal */}
      {adjustModal?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">调整额度</h3>
            <p className="text-gray-600 mb-4">
              为 <span className="font-medium text-gray-800">{adjustModal.userName}</span> 调整额度
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  调整金额
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdjustAmount((v) => v - 50)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => setAdjustAmount((v) => v + 50)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {adjustAmount > 0 ? `将增加 ¥${adjustAmount} 到本月额度` : adjustAmount < 0 ? `将扣除 ¥${Math.abs(adjustAmount)} 从本月额度` : '请输入调整金额'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setAdjustModal(null);
                  setAdjustAmount(0);
                }}
                className="flex-1 btn-secondary"
                disabled={processing}
              >
                取消
              </button>
              <button
                onClick={handleAdjustQuota}
                className="flex-1 btn-primary"
                disabled={processing || adjustAmount === 0}
              >
                {processing ? '处理中...' : '确认调整'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Notice */}
      <div className="card p-5 bg-blue-50 border border-blue-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">管理说明</p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• 每月1日系统自动重置所有用户额度，上月剩余额度不累加</li>
              <li>• 管理员可手动调整个别用户的当月额度，调整记录将永久保存</li>
              <li>• 重置操作会将已使用额度清零，并重新发放本月全额度</li>
              <li>• 额度标准：普通员工500元/月，VIP员工800元/月</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
