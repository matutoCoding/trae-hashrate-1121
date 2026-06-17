import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  RefreshCw,
  User,
  Crown,
  AlertTriangle,
  ArrowRight,
  Clock,
  Filter,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../utils/api';
import type { CutRecord } from '../../shared/types';
import { cn } from '../lib/utils';

export default function CutRecordsPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore((state) => state.currentUser);
  const [records, setRecords] = useState<CutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'vip' | 'urgent'>('all');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadRecords();
  }, [currentUser, navigate, filterType]);

  const loadRecords = async () => {
    try {
      let data;
      if (currentUser.role === 'admin') {
        data = await api.cut.getRecords(100);
      } else {
        data = await api.cut.getUserRecords(currentUser.id, 50);
      }
      let filtered = data;
      if (filterType !== 'all') {
        filtered = data.filter((r: CutRecord) => r.priority === filterType);
      }
      setRecords(filtered);
    } catch (e) {
      console.error('Failed to load cut records:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === 'vip') return { label: 'VIP插队', color: 'text-yellow-600 bg-yellow-50' };
    if (priority === 'urgent') return { label: '加急插队', color: 'text-red-600 bg-red-50' };
    return { label: '普通', color: 'text-gray-600 bg-gray-50' };
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'vip') return <Crown className="w-4 h-4" />;
    if (priority === 'urgent') return <Zap className="w-4 h-4" />;
    return null;
  };

  const isAffected = (record: CutRecord) => {
    return record.affectedUsers.includes(currentUser?.id || '');
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">插队记录</h2>
              <p className="text-sm text-gray-500">查看所有优先级插队记录及公平性公示</p>
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
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">总插队次数</p>
            <p className="text-2xl font-bold text-gray-800">{records.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600">VIP插队</p>
            <p className="text-2xl font-bold text-yellow-600">
              {records.filter((r) => r.priority === 'vip').length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600">加急插队</p>
            <p className="text-2xl font-bold text-red-600">
              {records.filter((r) => r.priority === 'urgent').length}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">筛选：</span>
          {(['all', 'vip', 'urgent'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                filterType === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type === 'all' ? '全部' : type === 'vip' ? 'VIP插队' : '加急插队'}
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="card p-12 text-center">
            <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">暂无插队记录</p>
          </div>
        ) : (
          records.map((record) => {
            const priorityInfo = getPriorityLabel(record.priority);
            const affected = isAffected(record);
            return (
              <div
                key={record.id}
                className={cn(
                  'card p-5 transition-all hover:shadow-md',
                  affected && 'ring-2 ring-orange-200 bg-orange-50/30'
                )}
              >
                {/* Affected Banner */}
                {affected && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>您的队列位置曾因此次插而后移</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">{record.userName}</span>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', priorityInfo.color)}>
                          {getPriorityIcon(record.priority)}
                          {priorityInfo.label}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        {record.reason}
                      </p>

                      {/* Position Change */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                          <span className="text-sm text-gray-500">原位置</span>
                          <span className="font-mono font-semibold text-gray-700">#{record.originalPosition}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-2 bg-primary-100 px-3 py-1.5 rounded-lg">
                          <span className="text-sm text-primary-600">新位置</span>
                          <span className="font-mono font-semibold text-primary-700">#{record.newPosition}</span>
                        </div>
                      </div>

                      {/* Affected Users */}
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-600">
                          此次插队影响 <span className="font-semibold text-orange-600">{record.affectedUsers.length}</span> 位用户
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-sm text-gray-400 ml-4 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                    {formatTime(record.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Fairness Notice */}
      <div className="card p-5 bg-blue-50 border border-blue-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">公平性说明</p>
            <p className="text-sm text-blue-600 mt-1">
              系统采用优先级队列算法，插队规则如下：加急单（权重3）＞ VIP单（权重2）＞ 普通单（权重1）。
              每次插队都会记录受影响的用户，所有插队记录公开透明，确保公平公正。
              如有疑问，请联系系统管理员。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
