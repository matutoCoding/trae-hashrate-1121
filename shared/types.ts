export type UserRole = 'employee' | 'vip' | 'stall_admin' | 'admin';
export type OrderPriority = 'normal' | 'vip' | 'urgent';
export type OrderStatus = 'waiting' | 'calling' | 'completed' | 'cancelled';
export type PaymentMethod = 'quota' | 'self_pay' | 'mixed';
export type SettlementStatus = 'pending' | 'settled';

export interface User {
  id: string;
  name: string;
  employeeId: string;
  role: UserRole;
  department: string;
  avatar?: string;
  createdAt: string;
}

export interface Quota {
  id: string;
  userId: string;
  monthlyAmount: number;
  usedAmount: number;
  remainingAmount: number;
  month: string;
  lastResetAt?: string;
  createdAt: string;
}

export interface Stall {
  id: string;
  name: string;
  type: string;
  location: string;
  commissionRate: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  stallId: string;
  category: string;
  description?: string;
  image?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNo: string;
  ticketNumber: number;
  userId: string;
  userName: string;
  stallId: string;
  stallName: string;
  items: OrderItem[];
  totalAmount: number;
  priority: OrderPriority;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  quotaUsed: number;
  selfPayAmount: number;
  queuePosition: number;
  estimatedWaitTime: number;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface QueueItem {
  orderId: string;
  ticketNumber: number;
  userName: string;
  priority: OrderPriority;
  queuePosition: number;
  estimatedWaitTime: number;
  status: OrderStatus;
  stallId: string;
  stallName: string;
  totalAmount: number;
}

export interface CutRecord {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  reason: string;
  priority: OrderPriority;
  originalPosition: number;
  newPosition: number;
  affectedUsers: string[];
  createdAt: string;
  approvedBy?: string;
}

export interface ConsumptionRecord {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  quotaUsed: number;
  selfPayAmount: number;
  stallId: string;
  stallName: string;
  items: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  stallId: string;
  stallName: string;
  date: string;
  totalOrders: number;
  totalAmount: number;
  settlementAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: SettlementStatus;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CreateOrderRequest {
  userId: string;
  stallId: string;
  items: { menuItemId: string; quantity: number }[];
  priority: OrderPriority;
}

export interface QueueStats {
  currentCalling?: QueueItem;
  waitingCount: number;
  avgWaitTime: number;
  todayCompleted: number;
}
