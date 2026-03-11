'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/hooks/useAuth'
import TabBar from '@/components/TabBar'
import Modal from '@/components/Modal'
import {
  Plus, Loader2, Trash2, TrendingUp, TrendingDown,
  ArrowUpCircle, ArrowDownCircle, RotateCcw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import type { FinanceEntry } from '@/lib/types'

const COLORS = ['#4c6ef5', '#fa5252', '#40c057', '#fab005', '#7950f2', '#15aabf', '#e64980', '#fd7e14']

type FilterMode = 'custom' | 'month' | 'year'

export default function FinancePage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAdd, setShowAdd] = useState(false)
  const [addType, setAddType] = useState<'income' | 'expense'>('expense')
  const [saving, setSaving] = useState(false)

  const now = new Date()
  const [filterMode, setFilterMode] = useState<FilterMode>('custom')
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(endOfMonth(now), 'yyyy-MM-dd'))
  const [selectedMonth, setSelectedMonth] = useState(format(now, 'yyyy-MM'))
  const [selectedYear, setSelectedYear] = useState(format(now, 'yyyy'))

  const [form, setForm] = useState({
    name: '',
    amount: '',
    payment_method: 'cash',
    remark: '',
    date: format(now, 'yyyy-MM-dd'),
  })

  useEffect(() => {
    if (user) loadEntries()
  }, [user])

  const loadEntries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('finance_entries')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
    if (data) setEntries(data)
    setLoading(false)
  }

  const effectiveDateRange = useMemo(() => {
    if (filterMode === 'month') {
      const d = parseISO(selectedMonth + '-01')
      return { from: format(startOfMonth(d), 'yyyy-MM-dd'), to: format(endOfMonth(d), 'yyyy-MM-dd') }
    }
    if (filterMode === 'year') {
      const d = new Date(parseInt(selectedYear), 0, 1)
      return { from: format(startOfYear(d), 'yyyy-MM-dd'), to: format(endOfYear(d), 'yyyy-MM-dd') }
    }
    return { from: dateFrom, to: dateTo }
  }, [filterMode, dateFrom, dateTo, selectedMonth, selectedYear])

  const filteredEntries = useMemo(() => {
    return entries.filter(e => e.date >= effectiveDateRange.from && e.date <= effectiveDateRange.to)
  }, [entries, effectiveDateRange])

  const incomeEntries = useMemo(() => filteredEntries.filter(e => e.type === 'income'), [filteredEntries])
  const expenseEntries = useMemo(() => filteredEntries.filter(e => e.type === 'expense'), [filteredEntries])

  const totalIncome = useMemo(() => incomeEntries.reduce((s, e) => s + e.amount, 0), [incomeEntries])
  const totalExpense = useMemo(() => expenseEntries.reduce((s, e) => s + e.amount, 0), [expenseEntries])
  const balance = totalIncome - totalExpense

  const chartData = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number }> = {}
    filteredEntries.forEach(e => {
      const m = e.date.substring(0, 7)
      if (!months[m]) months[m] = { month: m, income: 0, expense: 0 }
      if (e.type === 'income') months[m].income += e.amount
      else months[m].expense += e.amount
    })
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
  }, [filteredEntries])

  const pieData = useMemo(() => {
    const items = activeTab === 'income' ? incomeEntries : expenseEntries
    const grouped: Record<string, number> = {}
    items.forEach(e => {
      grouped[e.name] = (grouped[e.name] || 0) + e.amount
    })
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [activeTab, incomeEntries, expenseEntries])

  const resetFilter = () => {
    setFilterMode('custom')
    setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'))
    setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount || !user) return
    setSaving(true)

    const type = addType
    const payment = type === 'income'
      ? (form.payment_method === 'cash' ? 'personal' : 'company')
      : form.payment_method

    const { data, error } = await supabase
      .from('finance_entries')
      .insert({
        user_id: user.id,
        type,
        name: form.name,
        amount: parseFloat(form.amount),
        payment_method: payment,
        remark: form.remark,
        date: form.date,
      })
      .select()
      .single()

    if (data) {
      setEntries(prev => [data, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
    }

    setForm({ name: '', amount: '', payment_method: 'cash', remark: '', date: format(now, 'yyyy-MM-dd') })
    setShowAdd(false)
    setSaving(false)
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('ลบรายการนี้?')) return
    await supabase.from('finance_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const FilterSection = () => (
    <div className="px-4 py-3 space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setFilterMode('custom')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterMode === 'custom' ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600'}`}
        >
          กำหนดเอง
        </button>
        <button
          onClick={() => setFilterMode('month')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterMode === 'month' ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600'}`}
        >
          รายเดือน
        </button>
        <button
          onClick={() => setFilterMode('year')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterMode === 'year' ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600'}`}
        >
          รายปี
        </button>
        <button
          onClick={resetFilter}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-100 text-surface-600 hover:bg-surface-200 transition-all flex items-center gap-1"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {filterMode === 'custom' && (
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-500"
          />
          <span className="self-center text-surface-400 text-sm">ถึง</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-500"
          />
        </div>
      )}

      {filterMode === 'month' && (
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-500"
        />
      )}

      {filterMode === 'year' && (
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-white text-sm outline-none focus:border-brand-500"
        >
          {Array.from({ length: 10 }, (_, i) => now.getFullYear() - i).map(y => (
            <option key={y} value={y}>{y + 543}</option>
          ))}
        </select>
      )}
    </div>
  )

  const formatAmount = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (!user) return null

  return (
    <div className="animate-fade-in">
      <TabBar
        tabs={[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'income', label: 'รายรับ' },
          { key: 'expense', label: 'รายจ่าย' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <FilterSection />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand-500" size={28} />
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <div className="px-4 space-y-4 mt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 border border-surface-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ArrowUpCircle size={14} className="text-green-500" />
                    <span className="text-[10px] text-surface-500">รายรับ</span>
                  </div>
                  <p className="text-sm font-bold text-green-600">{formatAmount(totalIncome)}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-surface-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ArrowDownCircle size={14} className="text-red-500" />
                    <span className="text-[10px] text-surface-500">รายจ่าย</span>
                  </div>
                  <p className="text-sm font-bold text-red-600">{formatAmount(totalExpense)}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-surface-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    {balance >= 0 ? <TrendingUp size={14} className="text-brand-500" /> : <TrendingDown size={14} className="text-red-500" />}
                    <span className="text-[10px] text-surface-500">คงเหลือ</span>
                  </div>
                  <p className={`text-sm font-bold ${balance >= 0 ? 'text-brand-600' : 'text-red-600'}`}>{formatAmount(balance)}</p>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-surface-200">
                  <h3 className="text-sm font-semibold mb-3">สรุปรายเดือน</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: number) => formatAmount(value)}
                        labelFormatter={(l) => `เดือน ${l}`}
                      />
                      <Bar dataKey="income" name="รายรับ" fill="#40c057" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="รายจ่าย" fill="#fa5252" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-white rounded-xl p-4 border border-surface-200">
                <h3 className="text-sm font-semibold mb-3">รายการล่าสุด</h3>
                <div className="space-y-2">
                  {filteredEntries.slice(0, 10).map(e => (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{e.name}</p>
                        <p className="text-[10px] text-surface-400">{e.date} · {e.payment_method === 'cash' || e.payment_method === 'personal' ? (e.type === 'expense' ? 'เงินสด' : 'ส่วนตัว') : (e.type === 'expense' ? 'เงินโอน' : 'บริษัท')}</p>
                      </div>
                      <span className={`text-sm font-semibold ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {e.type === 'income' ? '+' : '-'}{formatAmount(e.amount)}
                      </span>
                    </div>
                  ))}
                  {filteredEntries.length === 0 && <p className="text-center text-surface-400 text-sm py-4">ไม่มีรายการ</p>}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'income' || activeTab === 'expense') && (
            <div className="px-4 space-y-3 mt-2">
              {pieData.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-surface-200">
                  <h3 className="text-sm font-semibold mb-2">สัดส่วน{activeTab === 'income' ? 'รายรับ' : 'รายจ่าย'}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatAmount(value)} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-50 border-b border-surface-200">
                        <th className="text-left p-3 font-medium text-surface-600">วันที่</th>
                        <th className="text-left p-3 font-medium text-surface-600">รายการ</th>
                        <th className="text-right p-3 font-medium text-surface-600">จำนวน</th>
                        <th className="text-center p-3 font-medium text-surface-600">ประเภท</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === 'income' ? incomeEntries : expenseEntries).map(e => (
                        <tr key={e.id} className="border-b border-surface-100 last:border-0">
                          <td className="p-3 text-xs text-surface-500 whitespace-nowrap">{e.date}</td>
                          <td className="p-3">
                            <p className="font-medium text-xs">{e.name}</p>
                            {e.remark && <p className="text-[10px] text-surface-400 mt-0.5">{e.remark}</p>}
                          </td>
                          <td className="p-3 text-right font-semibold text-xs">{formatAmount(e.amount)}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-100 text-surface-600">
                              {activeTab === 'expense'
                                ? (e.payment_method === 'cash' ? 'เงินสด' : 'เงินโอน')
                                : (e.payment_method === 'personal' ? 'ส่วนตัว' : 'บริษัท')
                              }
                            </span>
                          </td>
                          <td className="p-3">
                            <button onClick={() => deleteEntry(e.id)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(activeTab === 'income' ? incomeEntries : expenseEntries).length === 0 && (
                    <p className="text-center text-surface-400 text-sm py-8">ไม่มีรายการ</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-surface-200 flex justify-between items-center">
                <span className="text-sm font-medium text-surface-600">รวมทั้งหมด</span>
                <span className={`text-lg font-bold ${activeTab === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(activeTab === 'income' ? totalIncome : totalExpense)} ฿
                </span>
              </div>

              <button
                onClick={() => { setAddType(activeTab as 'income' | 'expense'); setShowAdd(true) }}
                className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center active:scale-90 transition-transform z-30"
              >
                <Plus size={24} />
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title={addType === 'income' ? 'เพิ่มรายรับ' : 'เพิ่มรายจ่าย'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">วันที่</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">ชื่อรายการ</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
              placeholder="ชื่อรายการ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">จำนวนเงิน</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              {addType === 'expense' ? 'ประเภทการจ่าย' : 'ประเภท'}
            </label>
            <div className="flex rounded-xl overflow-hidden border border-surface-200">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, payment_method: 'cash' }))}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  form.payment_method === 'cash'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-surface-600'
                }`}
              >
                {addType === 'expense' ? 'เงินสด' : 'ส่วนตัว'}
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, payment_method: 'transfer' }))}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  form.payment_method === 'transfer'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-surface-600'
                }`}
              >
                {addType === 'expense' ? 'เงินโอน' : 'บริษัท'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Remark</label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm(prev => ({ ...prev, remark: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm resize-none"
              placeholder="หมายเหตุ (ไม่จำเป็น)"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.amount}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            บันทึก
          </button>
        </div>
      </Modal>
    </div>
  )
}
