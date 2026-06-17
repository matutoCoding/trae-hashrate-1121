const API_BASE = '/api';

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || data.message || '请求失败');
  }
  return data.data;
}

export const api = {
  queue: {
    getQueue: (stallId?: string) =>
      request(`/queue${stallId ? `?stallId=${stallId}` : ''}`),
    getStats: (stallId?: string) =>
      request(`/queue/stats${stallId ? `?stallId=${stallId}` : ''}`),
    createTicket: (data: { userId: string; stallId: string; items: { menuItemId: string; quantity: number }[]; priority: string }) =>
      request('/queue/ticket', { method: 'POST', body: JSON.stringify(data) }),
    callNext: (stallId: string) =>
      request('/queue/call', { method: 'POST', body: JSON.stringify({ stallId }) }),
    complete: (orderId: string) =>
      request('/queue/complete', { method: 'POST', body: JSON.stringify({ orderId }) }),
    cancel: (orderId: string) =>
      request('/queue/cancel', { method: 'POST', body: JSON.stringify({ orderId }) }),
    getOrder: (orderId: string) =>
      request(`/queue/order/${orderId}`),
    getUserOrders: (userId: string, limit?: number) =>
      request(`/queue/user/${userId}${limit ? `?limit=${limit}` : ''}`),
  },
  quota: {
    get: (userId: string) =>
      request(`/quota/${userId}`),
    getHistory: (userId: string) =>
      request(`/quota/${userId}/history`),
    reset: (userId?: string) =>
      request('/quota/reset', { method: 'POST', body: JSON.stringify(userId ? { userId } : {}) }),
    adjust: (userId: string, amount: number) =>
      request('/quota/adjust', { method: 'POST', body: JSON.stringify({ userId, amount }) }),
  },
  cut: {
    getRecords: (limit?: number) =>
      request(`/cut/records${limit ? `?limit=${limit}` : ''}`),
    getUserRecords: (userId: string, limit?: number) =>
      request(`/cut/records/user/${userId}${limit ? `?limit=${limit}` : ''}`),
    getOrderRecord: (orderId: string) =>
      request(`/cut/records/order/${orderId}`),
  },
  consumption: {
    getUser: (userId: string, limit?: number) =>
      request(`/consumption/user/${userId}${limit ? `?limit=${limit}` : ''}`),
    getOrder: (orderId: string) =>
      request(`/consumption/order/${orderId}`),
    getUserStats: (userId: string, month?: string) =>
      request(`/consumption/stats/user/${userId}${month ? `?month=${month}` : ''}`),
    getSettlement: (stallId: string, date?: string) =>
      request(`/consumption/settlement/stall/${stallId}${date ? `?date=${date}` : ''}`),
    getSettlements: (date?: string) =>
      request(`/consumption/settlement${date ? `?date=${date}` : ''}`),
  },
  stall: {
    getAll: () =>
      request('/stall'),
    get: (stallId: string) =>
      request(`/stall/${stallId}`),
    getMenu: (stallId: string) =>
      request(`/stall/${stallId}/menu`),
    getAllMenu: () =>
      request('/stall/menu/all'),
  },
  user: {
    getAll: (role?: string) =>
      request(`/user${role ? `?role=${role}` : ''}`),
    get: (userId: string) =>
      request(`/user/${userId}`),
    login: (employeeId: string) =>
      request('/user/login', { method: 'POST', body: JSON.stringify({ employeeId }) }),
  },
};
