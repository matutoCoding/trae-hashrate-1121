import { create } from 'zustand';
import type { User, Quota, Order, QueueItem, QueueStats, Stall, MenuItem, CutRecord, ConsumptionRecord } from '../../shared/types';

interface AppState {
  currentUser: User | null;
  currentQuota: Quota | null;
  currentStall: Stall | null;
  stalls: Stall[];
  menuItems: MenuItem[];
  queue: QueueItem[];
  queueStats: QueueStats | null;
  userOrders: Order[];
  cutRecords: CutRecord[];
  consumptionRecords: ConsumptionRecord[];
  selectedStallId: string | null;

  setCurrentUser: (user: User | null) => void;
  setCurrentQuota: (quota: Quota | null) => void;
  setCurrentStall: (stall: Stall | null) => void;
  setStalls: (stalls: Stall[]) => void;
  setMenuItems: (items: MenuItem[]) => void;
  setQueue: (queue: QueueItem[]) => void;
  setQueueStats: (stats: QueueStats | null) => void;
  setUserOrders: (orders: Order[]) => void;
  setCutRecords: (records: CutRecord[]) => void;
  setConsumptionRecords: (records: ConsumptionRecord[]) => void;
  setSelectedStallId: (id: string | null) => void;

  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  currentQuota: null,
  currentStall: null,
  stalls: [],
  menuItems: [],
  queue: [],
  queueStats: null,
  userOrders: [],
  cutRecords: [],
  consumptionRecords: [],
  selectedStallId: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentQuota: (quota) => set({ currentQuota: quota }),
  setCurrentStall: (stall) => set({ currentStall: stall }),
  setStalls: (stalls) => set({ stalls }),
  setMenuItems: (menuItems) => set({ menuItems }),
  setQueue: (queue) => set({ queue }),
  setQueueStats: (queueStats) => set({ queueStats }),
  setUserOrders: (userOrders) => set({ userOrders }),
  setCutRecords: (cutRecords) => set({ cutRecords }),
  setConsumptionRecords: (consumptionRecords) => set({ consumptionRecords }),
  setSelectedStallId: (selectedStallId) => set({ selectedStallId }),

  logout: () => set({
    currentUser: null,
    currentQuota: null,
    userOrders: [],
    consumptionRecords: [],
  }),
}));
