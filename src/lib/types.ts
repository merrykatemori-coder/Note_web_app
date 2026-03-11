export interface Memo {
  id: string
  user_id: string
  tab: string
  topic: string
  details: string
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface FinanceEntry {
  id: string
  user_id: string
  type: 'income' | 'expense'
  name: string
  amount: number
  payment_method: string
  remark: string
  date: string
  created_at: string
}

export interface WorkOrder {
  id: string
  user_id: string
  category: string
  status: 'todo' | 'doing' | 'done'
  date: string
  topic: string
  order_detail: string
  remark: string
  created_at: string
  updated_at: string
}

export interface SalaryEntry {
  id: string
  user_id: string
  date: string
  salary: number
  commission: number
  brand: string
  remark: string
  period_from: string
  period_to: string
  created_at: string
}

export interface DropdownSetting {
  id: string
  user_id: string
  category: 'memo_brand' | 'salary_brand' | 'income_type' | 'expense_type'
  value: string
  sort_order: number
  created_at: string
}
