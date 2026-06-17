import { v4 as uuidv4 } from 'uuid';
import { db } from './index.js';

const currentMonth = new Date().toISOString().slice(0, 7);

const mockUsers = [
  { id: 'user-001', name: '张伟', employeeId: 'EMP001', role: 'admin', department: '行政部' },
  { id: 'user-002', name: '李娜', employeeId: 'EMP002', role: 'vip', department: '技术部' },
  { id: 'user-003', name: '王强', employeeId: 'EMP003', role: 'employee', department: '市场部' },
  { id: 'user-004', name: '刘芳', employeeId: 'EMP004', role: 'employee', department: '人事部' },
  { id: 'user-005', name: '陈明', employeeId: 'EMP005', role: 'vip', department: '财务部' },
  { id: 'user-006', name: '赵丽', employeeId: 'EMP006', role: 'employee', department: '技术部' },
  { id: 'user-007', name: '孙磊', employeeId: 'EMP007', role: 'stall_admin', department: '运营部' },
  { id: 'user-008', name: '周杰', employeeId: 'EMP008', role: 'employee', department: '市场部' },
];

const mockStalls = [
  { id: 'stall-001', name: '川味小厨', type: '中式快餐', location: 'A区1号', commissionRate: 0.1 },
  { id: 'stall-002', name: '粤式茶餐厅', type: '港式料理', location: 'A区2号', commissionRate: 0.1 },
  { id: 'stall-003', name: '日式拉面', type: '日式料理', location: 'B区1号', commissionRate: 0.12 },
  { id: 'stall-004', name: '西式简餐', type: '西餐', location: 'B区2号', commissionRate: 0.1 },
  { id: 'stall-005', name: '清真餐厅', type: '清真美食', location: 'C区1号', commissionRate: 0.08 },
];

const mockMenuItems = [
  { id: 'menu-001', stallId: 'stall-001', name: '麻婆豆腐饭', price: 18, category: '主食', description: '正宗川味，麻辣鲜香' },
  { id: 'menu-002', stallId: 'stall-001', name: '宫保鸡丁饭', price: 22, category: '主食', description: '经典川菜，酸甜微辣' },
  { id: 'menu-003', stallId: 'stall-001', name: '鱼香肉丝饭', price: 20, category: '主食', description: '传统川味，鱼肉鲜嫩' },
  { id: 'menu-004', stallId: 'stall-001', name: '酸辣汤', price: 8, category: '汤品', description: '开胃暖身' },
  { id: 'menu-005', stallId: 'stall-002', name: '虾饺皇', price: 28, category: '点心', description: '晶莹剔透，虾肉饱满' },
  { id: 'menu-006', stallId: 'stall-002', name: '叉烧饭', price: 25, category: '主食', description: '蜜汁叉烧，香嫩可口' },
  { id: 'menu-007', stallId: 'stall-002', name: '云吞面', price: 22, category: '主食', description: '鲜虾云吞，竹升面' },
  { id: 'menu-008', stallId: 'stall-002', name: '港式奶茶', price: 12, category: '饮品', description: '香浓丝滑' },
  { id: 'menu-009', stallId: 'stall-003', name: '豚骨拉面', price: 32, category: '主食', description: '浓郁豚骨汤底' },
  { id: 'menu-010', stallId: 'stall-003', name: '味噌拉面', price: 28, category: '主食', description: '经典味噌风味' },
  { id: 'menu-011', stallId: 'stall-003', name: '日式煎饺', price: 15, category: '小吃', description: '皮脆馅嫩' },
  { id: 'menu-012', stallId: 'stall-003', name: '照烧鸡排饭', price: 26, category: '主食', description: '照烧酱汁，鸡排外酥里嫩' },
  { id: 'menu-013', stallId: 'stall-004', name: '黑椒牛柳饭', price: 35, category: '主食', description: '黑椒香浓，牛柳嫩滑' },
  { id: 'menu-014', stallId: 'stall-004', name: '意大利肉酱面', price: 32, category: '主食', description: '番茄肉酱，意式风味' },
  { id: 'menu-015', stallId: 'stall-004', name: '凯撒沙拉', price: 18, category: '沙拉', description: '新鲜蔬菜，凯撒酱' },
  { id: 'menu-016', stallId: 'stall-004', name: '美式咖啡', price: 15, category: '饮品', description: '现磨咖啡' },
  { id: 'menu-017', stallId: 'stall-005', name: '新疆大盘鸡', price: 38, category: '主食', description: '分量十足，鸡肉鲜嫩' },
  { id: 'menu-018', stallId: 'stall-005', name: '兰州拉面', price: 20, category: '主食', description: '手工面条，牛肉汤底' },
  { id: 'menu-019', stallId: 'stall-005', name: '手抓饭', price: 25, category: '主食', description: '新疆特色，羊肉飘香' },
  { id: 'menu-020', stallId: 'stall-005', name: '烤羊肉串', price: 15, category: '烧烤', description: '三串起售，孜然飘香' },
];

export function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, employee_id, role, department)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertQuota = db.prepare(`
    INSERT INTO quotas (id, user_id, monthly_amount, used_amount, remaining_amount, month)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertStall = db.prepare(`
    INSERT INTO stalls (id, name, type, location, commission_rate)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (id, stall_id, name, price, category, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const user of mockUsers) {
      insertUser.run(user.id, user.name, user.employeeId, user.role, user.department);
      const monthlyAmount = user.role === 'vip' ? 800 : 500;
      const usedAmount = Math.floor(Math.random() * 200);
      insertQuota.run(
        uuidv4(),
        user.id,
        monthlyAmount,
        usedAmount,
        monthlyAmount - usedAmount,
        currentMonth
      );
    }

    for (const stall of mockStalls) {
      insertStall.run(stall.id, stall.name, stall.type, stall.location, stall.commissionRate);
    }

    for (const item of mockMenuItems) {
      insertMenuItem.run(
        item.id, item.stallId, item.name, item.price, item.category, item.description
      );
    }
  });

  tx();
  console.log('Database seeded successfully!');
}
