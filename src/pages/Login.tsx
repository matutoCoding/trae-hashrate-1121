import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, LogIn, User } from 'lucide-react';
import { api } from '../utils/api';
import { useAppStore } from '../store/useAppStore';

export default function Login() {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const setCurrentQuota = useAppStore((state) => state.setCurrentQuota);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('请输入工号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await api.user.login(employeeId.trim());
      setCurrentUser(user);

      try {
        const quota = await api.quota.get(user.id);
        setCurrentQuota(quota);
      } catch (e) {
        console.error('Failed to load quota:', e);
      }

      navigate('/');
    } catch (e) {
      setError((e as Error).message || '登录失败，请检查工号');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (id: string) => {
    setEmployeeId(id);
    setLoading(true);
    setError('');

    try {
      const user = await api.user.login(id);
      setCurrentUser(user);

      try {
        const quota = await api.quota.get(user.id);
        setCurrentQuota(quota);
      } catch (e) {
        console.error('Failed to load quota:', e);
      }

      navigate('/');
    } catch (e) {
      setError((e as Error).message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { id: 'EMP001', name: '张伟', role: '管理员' },
    { id: 'EMP002', name: '李娜', role: 'VIP员工' },
    { id: 'EMP003', name: '王强', role: '普通员工' },
    { id: 'EMP007', name: '孙磊', role: '档口管理' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">美食广场</h1>
          <p className="text-gray-500">智慧订餐取餐系统</p>
        </div>

        <div className="card p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                员工工号
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="请输入您的工号"
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  登录系统
                </>
              )}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-sm text-gray-500 text-center mb-4">快速登录（演示账号）</p>
            <div className="grid grid-cols-2 gap-3">
              {demoUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => quickLogin(user.id)}
                  disabled={loading}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-all text-left disabled:opacity-50"
                >
                  <p className="font-medium text-gray-800 text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          © 2024 美食广场智慧订餐系统
        </p>
      </div>
    </div>
  );
}
