'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/hooks/useAuth'
import TabBar from '@/components/TabBar'
import { Plus, Loader2, Trash2, GripVertical } from 'lucide-react'
import type { DropdownSetting } from '@/lib/types'

const CATEGORIES = [
  { key: 'memo_brand', label: 'Memo Tab' },
  { key: 'salary_brand', label: 'Salary Brand' },
  { key: 'work_list', label: 'Work List' },
]

const DEFAULTS: Record<string, string[]> = {
  memo_brand: ['Office', 'Hs Cargo', 'EOS', 'Mori', 'Tolun', 'Personal'],
  salary_brand: ['HS Cargo', 'EOS', 'Mori', 'Tolun'],
  work_list: ['ส่วนตัว', 'HS Cargo', 'EOS', 'Mori', 'Tolun'],
}

export default function SettingsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [activeCategory, setActiveCategory] = useState('memo_brand')
  const [items, setItems] = useState<DropdownSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) loadItems()
  }, [user, activeCategory])

  const loadItems = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('dropdown_settings')
      .select('*')
      .eq('user_id', user!.id)
      .eq('category', activeCategory)
      .order('sort_order')

    if (data && data.length > 0) {
      setItems(data)
    } else {
      const defaults = DEFAULTS[activeCategory] || []
      if (defaults.length > 0) {
        const inserts = defaults.map((value, i) => ({
          user_id: user!.id,
          category: activeCategory,
          value,
          sort_order: i,
        }))
        const { data: inserted } = await supabase
          .from('dropdown_settings')
          .insert(inserts)
          .select()
        if (inserted) setItems(inserted)
      } else {
        setItems([])
      }
    }
    setLoading(false)
  }

  const addItem = async () => {
    if (!newValue.trim() || !user) return
    setSaving(true)

    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0

    const { data } = await supabase
      .from('dropdown_settings')
      .insert({
        user_id: user.id,
        category: activeCategory,
        value: newValue.trim(),
        sort_order: maxOrder,
      })
      .select()
      .single()

    if (data) setItems(prev => [...prev, data])
    setNewValue('')
    setSaving(false)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('ลบรายการนี้?')) return
    await supabase.from('dropdown_settings').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newItems.length) return

    const temp = newItems[index].sort_order
    newItems[index].sort_order = newItems[swapIndex].sort_order
    newItems[swapIndex].sort_order = temp;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]]

    setItems(newItems)

    await Promise.all([
      supabase.from('dropdown_settings').update({ sort_order: newItems[index].sort_order }).eq('id', newItems[index].id),
      supabase.from('dropdown_settings').update({ sort_order: newItems[swapIndex].sort_order }).eq('id', newItems[swapIndex].id),
    ])
  }

  if (!user) return null

  return (
    <div className="animate-fade-in">
      <div className="px-4 py-3">
        <h2 className="text-lg font-bold">ตั้งค่า Dropdown</h2>
        <p className="text-xs text-surface-500 mt-1">จัดการรายการ dropdown ในแต่ละหมวดหมู่</p>
      </div>

      <TabBar
        tabs={CATEGORIES.map(c => ({ key: c.key, label: c.label }))}
        activeTab={activeCategory}
        onChange={setActiveCategory}
      />

      <div className="px-4 space-y-3 mt-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
            placeholder="เพิ่มรายการใหม่..."
          />
          <button
            onClick={addItem}
            disabled={saving || !newValue.trim()}
            className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            เพิ่ม
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-500" size={28} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-surface-400 text-sm">ยังไม่มีรายการ</div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3 border border-surface-200 flex items-center gap-3"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="text-surface-400 hover:text-surface-600 disabled:opacity-30 text-xs"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === items.length - 1}
                    className="text-surface-400 hover:text-surface-600 disabled:opacity-30 text-xs"
                  >
                    ▼
                  </button>
                </div>
                <GripVertical size={16} className="text-surface-300 flex-shrink-0" />
                <span className="text-sm font-medium flex-1">{item.value}</span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-red-400 hover:text-red-600 p-1.5 flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
