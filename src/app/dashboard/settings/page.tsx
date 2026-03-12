'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const dragY = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)

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

  const getIndexFromY = (clientY: number): number => {
    if (!listRef.current) return 0
    const children = Array.from(listRef.current.children) as HTMLElement[]
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return i
    }
    return children.length - 1
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
    setOverIndex(index)
  }

  const handleDragMove = (clientY: number) => {
    if (dragIndex === null) return
    const newOver = getIndexFromY(clientY)
    if (newOver !== overIndex) setOverIndex(newOver)
  }

  const handleDragEnd = async () => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }

    const newItems = [...items]
    const [moved] = newItems.splice(dragIndex, 1)
    newItems.splice(overIndex, 0, moved)

    const updated = newItems.map((item, i) => ({ ...item, sort_order: i }))
    setItems(updated)
    setDragIndex(null)
    setOverIndex(null)

    await Promise.all(
      updated.map(item =>
        supabase.from('dropdown_settings').update({ sort_order: item.sort_order }).eq('id', item.id)
      )
    )
  }

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    dragY.current = e.touches[0].clientY
    handleDragStart(index)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    handleDragMove(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    handleDragStart(index)

    const onMove = (ev: MouseEvent) => handleDragMove(ev.clientY)
    const onUp = () => {
      handleDragEnd()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const getDisplayItems = () => {
    if (dragIndex === null || overIndex === null) return items
    const display = [...items]
    const [moved] = display.splice(dragIndex, 1)
    display.splice(overIndex, 0, moved)
    return display
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
          <div ref={listRef} className="space-y-2">
            {getDisplayItems().map((item, index) => {
              const isDragging = dragIndex !== null && item.id === items[dragIndex]?.id
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl p-3 border flex items-center gap-3 transition-all ${
                    isDragging
                      ? 'border-brand-400 shadow-lg shadow-brand-500/10 scale-[1.02] opacity-90'
                      : 'border-surface-200'
                  }`}
                >
                  <div
                    className="touch-none cursor-grab active:cursor-grabbing p-1 text-surface-300 hover:text-surface-500"
                    onMouseDown={(e) => handleMouseDown(e, items.indexOf(item))}
                    onTouchStart={(e) => handleTouchStart(e, items.indexOf(item))}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <GripVertical size={18} />
                  </div>
                  <span className="text-sm font-medium flex-1">{item.value}</span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-400 hover:text-red-600 p-1.5 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
