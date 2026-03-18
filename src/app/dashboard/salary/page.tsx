'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRole } from '@/hooks/useRole'
import Modal from '@/components/Modal'
import { Plus, Loader2, Trash2, PlusCircle, X } from 'lucide-react'
import { format } from 'date-fns'
import type { SalaryEntry } from '@/lib/types'

const DEFAULT_BRANDS = ['HS Cargo', 'EOS', 'Mori', 'Tolun']

interface SalaryRow {
  salary: string
  commission: string
  brand: string
}

export default function SalaryPage() {
  const { user, isAdmin } = useRole()
  const supabase = createClient()
  const [entries, setEntries] = useState<SalaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS)

  const now = new Date()
  const currentMonth = format(now, 'yyyy-MM')

  const [periodFrom, setPeriodFrom] = useState(currentMonth)
  const [periodTo, setPeriodTo] = useState(currentMonth)
  const [paymentDate, setPaymentDate] = useState(format(now, 'yyyy-MM-dd'))
  const [remark, setRemark] = useState('')
  const [rows, setRows] = useState<SalaryRow[]>([{ salary: '', commission: '', brand: DEFAULT_BRANDS[0] }])

  useEffect(() => {
    if (user) {
      loadEntries()
      loadBrands()
    }
  }, [user])

  const loadBrands = async () => {
    const { data } = await supabase
      .from('dropdown_settings')
      .select('value')
      .eq('category', 'salary_brand')
      .order('sort_order')

    if (data && data.length > 0) {
      const b = data.map(d => d.value)
      setBrands(b)
      setRows([{ salary: '', commission: '', brand: b[0] }])
    }
  }

  const loadEntries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('salary_entries')
      .select('*')
      .order('date', { ascending: false })
    if (data) setEntries(data)
    setLoading(false)
  }

  const addRow = () => {
    setRows(prev => [...prev, { salary: '', commission: '', brand: brands[0] }])
  }

  const removeRow = (index: number) => {
    if (rows.length <= 1) return
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof SalaryRow, value: string) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const handleSave = async () => {
    if (!user) return
    const validRows = rows.filter(r => parseFloat(r.salary) > 0 || parseFloat(r.commission) > 0)
    if (validRows.length === 0) return
    setSaving(true)

    const inserts = validRows.map(r => ({
      user_id: user.id,
      date: paymentDate,
      salary: parseFloat(r.salary) || 0,
      commission: parseFloat(r.commission) || 0,
      brand: r.brand,
      remark: remark,
      period_from: periodFrom,
      period_to: periodTo,
    }))

    const { data } = await supabase
      .from('salary_entries')
      .insert(inserts)
      .select()

    if (data) setEntries(prev => [...data, ...prev].sort((a, b) => b.date.localeCompare(a.date)))

    setRows([{ salary: '', commission: '', brand: brands[0] }])
    setRemark('')
    setPeriodFrom(currentMonth)
    setPeriodTo(currentMonth)
    setPaymentDate(format(now, 'yyyy-MM-dd'))
    setShowAdd(false)
    setSaving(false)
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('ลบรายการนี้?')) return
    await supabase.from('salary_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const formatAmount = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (!user) return null

  return (
    <div className="animate-fade-in">
      <div className="px-4 py-3">
        <h2 className="text-lg font-bold">Salary / Commission</h2>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-500" size={28} />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-surface-400 text-sm">ยังไม่มีรายการ</div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl p-4 border border-surface-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 text-xs font-medium">{entry.brand}</span>
                    <span className="text-[10px] text-surface-400">จ่าย {entry.date}</span>
                  </div>
                  {(entry as any).period_from && (
                    <p className="text-[10px] text-surface-400 mb-1">งวด {(entry as any).period_from} ถึง {(entry as any).period_to}</p>
                  )}
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[10px] text-surface-400">Salary</span>
                      <p className="text-sm font-semibold text-green-600">{formatAmount(entry.salary)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-surface-400">Commission</span>
                      <p className="text-sm font-semibold text-brand-600">{formatAmount(entry.commission)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-surface-400">รวม</span>
                      <p className="text-sm font-bold">{formatAmount(entry.salary + entry.commission)}</p>
                    </div>
                  </div>
                  {entry.remark && <p className="text-xs text-surface-500 mt-2">{entry.remark}</p>}
                </div>
                {isAdmin && (
                  <button onClick={() => deleteEntry(entry.id)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isAdmin && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center active:scale-90 transition-transform z-30"
        >
          <Plus size={24} />
        </button>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="เพิ่มรายการ Salary / Commission">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">งวดเดือน</label>
            <div className="flex gap-2 items-center">
              <input
                type="month"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-500"
              />
              <span className="text-surface-400 text-sm">ถึง</span>
              <input
                type="month"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">วันที่จ่ายเงิน</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">รายการ</label>
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1 text-xs text-brand-600 font-medium hover:text-brand-700"
              >
                <PlusCircle size={14} />
                เพิ่มแถว
              </button>
            </div>
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div key={index} className="bg-surface-50 rounded-xl p-3 border border-surface-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500 font-medium">#{index + 1}</span>
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(index)} className="text-red-400 hover:text-red-600 p-0.5">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <select
                    value={row.brand}
                    onChange={(e) => updateRow(index, 'brand', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-white text-sm outline-none focus:border-brand-500 appearance-none"
                  >
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-surface-400">Salary</label>
                      <input
                        type="number"
                        value={row.salary}
                        onChange={(e) => updateRow(index, 'salary', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-white text-sm outline-none focus:border-brand-500"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-surface-400">Commission</label>
                      <input
                        type="number"
                        value={row.commission}
                        onChange={(e) => updateRow(index, 'commission', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 bg-white text-sm outline-none focus:border-brand-500"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Remark</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm resize-none"
              placeholder="หมายเหตุ"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
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
