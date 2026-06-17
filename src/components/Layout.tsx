import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  UtensilsCrossed,
  Users,
  Clock,
  Zap,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Crown,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/order', label: '点餐取号', icon: UtensilsCrossed },
  { path: '/queue', label: '实时队列', icon: Clock },
  { path: '/call', label: '叫号管理', icon: Users, roles: ['stall_admin', 'admin'] },
  { path: '/cut', label: '插队管理', icon: Zap, roles: ['admin'] },
  { path: '/cut/records', label: '插队记录', icon: Zap },
  { path: '/quota', label: '我的额度', icon: CreditCard },
  { path: '/quota/admin', label: '额度管理', icon: Settings, roles: ['admin'] },
  { path: '/consumption', label: '消费明细', icon: Receipt },
  { path: '/settlement', label: '档口结算', icon: Receipt, roles: ['stall_admin', 'admin'] },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = useAppStore((state) => state.currentUser);
  const currentQuota = useAppStore((state) => state.currentQuota);
  const logout = useAppStore((state) => state.logout);

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPriorityBadge = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'vip') {
      return (
        <span className="badge badge-accent flex items-center gap-1">
          <Crown className="w-3 h-3" />
          VIP
        </span>
      );
    }
    if (currentUser.role === 'admin') {
      return <span className="badge badge-secondary">管理员</span>;
    }
    if (currentUser.role === 'stall_admin') {
      return <span className="badge badge-primary">档口管理</span>;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-100 flex flex-col transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-800">美食广场</span>
            </div>
          )}
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <button
            className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'sidebar-item',
                  isActive && 'sidebar-item-active',
                  !sidebarOpen && 'justify-center px-2'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        {currentUser && sidebarOpen && (
          <div className="p-3 border-t border-gray-100">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.department}</p>
                </div>
                {getPriorityBadge()}
              </div>
              {currentQuota && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">本月额度</span>
                    <span className="font-medium text-primary-600">
                      ¥{currentQuota.remainingAmount.toFixed(2)} / ¥{currentQuota.monthlyAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min((currentQuota.usedAmount / currentQuota.monthlyAmount) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {filteredNavItems.find((item) =>
                item.path === location.pathname ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              )?.label || '美食广场'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && !sidebarOpen && (
              <div className="flex items-center gap-2">
                {currentQuota && (
                  <span className="text-sm font-medium text-primary-600">
                    ¥{currentQuota.remainingAmount.toFixed(0)}
                  </span>
                )}
                {getPriorityBadge()}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
