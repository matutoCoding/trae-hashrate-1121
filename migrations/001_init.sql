CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'vip', 'stall_admin', 'admin')),
  department TEXT,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  monthly_amount REAL NOT NULL DEFAULT 500,
  used_amount REAL NOT NULL DEFAULT 0,
  remaining_amount REAL NOT NULL DEFAULT 500,
  month TEXT NOT NULL,
  last_reset_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month)
);

CREATE TABLE IF NOT EXISTS stalls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  commission_rate REAL NOT NULL DEFAULT 0.1
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  stall_id TEXT NOT NULL REFERENCES stalls(id),
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT,
  description TEXT,
  image TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  ticket_number INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  user_name TEXT NOT NULL,
  stall_id TEXT NOT NULL REFERENCES stalls(id),
  stall_name TEXT NOT NULL,
  total_amount REAL NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'vip', 'urgent')),
  status TEXT NOT NULL CHECK (status IN ('waiting', 'calling', 'completed', 'cancelled')) DEFAULT 'waiting',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('quota', 'self_pay', 'mixed')),
  quota_used REAL NOT NULL DEFAULT 0,
  self_pay_amount REAL NOT NULL DEFAULT 0,
  queue_position INTEGER NOT NULL,
  estimated_wait_time INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  called_at DATETIME,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  menu_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cut_records (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  user_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL,
  original_position INTEGER NOT NULL,
  new_position INTEGER NOT NULL,
  affected_users TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_by TEXT
);

CREATE TABLE IF NOT EXISTS consumption_records (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL REFERENCES orders(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  quota_used REAL NOT NULL DEFAULT 0,
  self_pay_amount REAL NOT NULL DEFAULT 0,
  stall_id TEXT NOT NULL REFERENCES stalls(id),
  stall_name TEXT NOT NULL,
  items TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  stall_id TEXT NOT NULL REFERENCES stalls(id),
  stall_name TEXT NOT NULL,
  date TEXT NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  settlement_amount REAL NOT NULL DEFAULT 0,
  commission_rate REAL NOT NULL DEFAULT 0.1,
  commission_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'settled')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stall_id, date)
);

CREATE INDEX IF NOT EXISTS idx_orders_stall_status ON orders(stall_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_user ON consumption_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_stall ON consumption_records(stall_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cut_records_order ON cut_records(order_id);
