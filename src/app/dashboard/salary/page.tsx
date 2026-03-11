'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/hooks/useAuth'
import Modal from '@/components/Modal'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import type { SalaryEntry } from '@/lib/types'

const DEFAULT_BRANDS = ['HS Cargo', 'EOS', 'Mori', 'Tolun']

export default function SalaryPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [entries, setEntries] = useState<SalaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    salary: '',
    commission: '',
    brand: DEFAULT_BRANDS[0],
    remark: '',
  })

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
      .eq('user_id', user!.id)
      .eq('category', 'salary_brand')
      .order('sort_order')

    if (data && data.length > 0) {
      const b = data.map(d => d.value)
      setBrands(b)
      setForm(prev => ({ ...prev, brand: b[0] }))
    }
  }

  const loadEntries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('salary_entries')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
    if (data) setEntries(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    const { data } = await supabase
      .from('salary_entries')
      .insert({
        user_id: user.id,
        date: form.date,
        salary: parseFloat(form.salary) || 0,
        commission: parseFloat(form.commission) || 0,
        brand: form.brand,
        remark: form.remark,
      })
      .select()
      .single()

    if (data) setEntries(prev => [data, ...prev])
    setForm({ date: new Date().toISOString().split('T')[0], salary: '', commission: '', brand: brands[0], remark: '' })
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
                    <span className="text-[10px] text-surface-400">{entry.date}</span>
                  </div>
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
                <button onClick={() => deleteEntry(entry.id)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center active:scale-90 transition-transform z-30"
      >
        <Plus size={24} />
      </button>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="เพิ่มรายการ Salary / Commission">
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
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Salary</label>
            <input
              type="number"
              value={form.salary}
              onChange={(e) => setForm(prev => ({ ...prev, salary: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Commission</label>
            <input
              type="number"
              value={form.commission}
              onChange={(e) => setForm(prev => ({ ...prev, commission: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Brand</label>
            <select
              value={form.brand}
              onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
            >
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Remark</label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm(prev => ({ ...prev, remark: e.target.value }))}
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
