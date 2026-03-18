'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/hooks/useAuth'
import TabBar from '@/components/TabBar'
import SearchBar from '@/components/SearchBar'
import Modal from '@/components/Modal'
import { Plus, Loader2, Trash2, ChevronLeft, Edit3, CheckCircle2, Clock, CircleDot } from 'lucide-react'
import type { WorkOrder } from '@/lib/types'

const DEFAULT_CATEGORIES = ['ส่วนตัว', 'HS Cargo', 'EOS', 'Mori', 'Tolun']

const STATUS_CONFIG = {
  todo: { label: 'Todo', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  doing: { label: 'Doing', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CircleDot },
  done: { label: 'Done', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
}

export default function WorkOrderPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [category, setCategory] = useState('')
  const [statusTab, setStatusTab] = useState<'todo' | 'doing' | 'done'>('todo')
  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState<WorkOrder | null>(null)
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [ready, setReady] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    topic: '',
    order_detail: '',
    status: 'todo' as 'todo' | 'doing' | 'done',
    remark: '',
  })

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    const [catRes, orderRes] = await Promise.all([
      supabase
        .from('dropdown_settings')
        .select('value')
        .eq('user_id', user!.id)
        .eq('category', 'work_list')
        .order('sort_order'),
      supabase
        .from('work_orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
    ])

    if (catRes.data && catRes.data.length > 0) {
      const cats = [...new Set(catRes.data.map(d => d.value))]
      setCategories(cats)
      if (!category) setCategory(cats[0])
    } else {
      setCategories(DEFAULT_CATEGORIES)
      if (!category) setCategory(DEFAULT_CATEGORIES[0])
    }

    if (orderRes.data) setOrders(orderRes.data)
    setReady(true)
    setLoading(false)
  }

  const handleCategoryChange = useCallback((k: string) => {
    setCategory(k)
  }, [])

  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => o.category === category && o.status === statusTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        (o.topic || '').toLowerCase().includes(q) ||
        o.order_detail.toLowerCase().includes(q) ||
        o.remark.toLowerCase().includes(q)
      )
    }
    return result
  }, [orders, category, statusTab, search])

  const countByStatus = useMemo(() => {
    const catOrders = orders.filter(o => o.category === category)
    return {
      todo: catOrders.filter(o => o.status === 'todo').length,
      doing: catOrders.filter(o => o.status === 'doing').length,
      done: catOrders.filter(o => o.status === 'done').length,
    }
  }, [orders, category])

  const handleSave = async () => {
    if (!form.order_detail.trim() || !user) return
    setSaving(true)

    if (editingOrder) {
      const { error } = await supabase
        .from('work_orders')
        .update({
          date: form.date,
          topic: form.topic,
          order_detail: form.order_detail,
          status: form.status,
          remark: form.remark,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingOrder.id)

      if (!error) {
        setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...form, updated_at: new Date().toISOString() } : o))
        setEditingOrder(null)
        setShowDetail(null)
      }
    } else {
      const { data } = await supabase
        .from('work_orders')
        .insert({
          user_id: user.id,
          category,
          date: form.date,
          topic: form.topic,
          order_detail: form.order_detail,
          status: form.status,
          remark: form.remark,
        })
        .select()
        .single()

      if (data) {
        setOrders(prev => [data, ...prev])
        if (form.status === 'todo') {
          fetch('/api/line-notify-single', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category,
              topic: form.topic,
              order_detail: form.order_detail,
              remark: form.remark,
              date: form.date,
            }),
          }).catch(() => {})
        }
      }
    }

    setForm({ date: new Date().toISOString().split('T')[0], topic: '', order_detail: '', status: 'todo', remark: '' })
    setShowAdd(false)
    setSaving(false)
  }

  const changeStatus = async (order: WorkOrder, newStatus: 'todo' | 'doing' | 'done') => {
    await supabase.from('work_orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', order.id)
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o))
    setShowDetail(prev => prev?.id === order.id ? { ...prev, status: newStatus } : prev)
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('ลบรายการนี้?')) return
    await supabase.from('work_orders').delete().eq('id', id)
    setOrders(prev => prev.filter(o => o.id !== id))
    setShowDetail(null)
  }

  const openEdit = (order: WorkOrder) => {
    setEditingOrder(order)
    setForm({ date: order.date, topic: (order as any).topic || '', order_detail: order.order_detail, status: order.status, remark: order.remark })
    setShowAdd(true)
    setShowDetail(null)
  }

  if (!user || !ready) return null

  return (
    <div className="animate-fade-in">
      <TabBar
        tabs={categories.map(c => ({ key: c, label: c }))}
        activeTab={category}
        onChange={handleCategoryChange}
      />

      <div className="flex gap-1 px-4 pb-3 justify-center">
        {(['todo', 'doing', 'done'] as const).map(s => {
          const config = STATUS_CONFIG[s]
          const Icon = config.icon
          return (
            <button
              key={s}
              onClick={() => setStatusTab(s)}
              className={`flex-1 max-w-[140px] py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 border ${
                statusTab === s ? config.color + ' border-current' : 'bg-white border-surface-200 text-surface-500'
              }`}
            >
              <Icon size={14} />
              {config.label}
              <span className="ml-0.5 opacity-70">({countByStatus[s]})</span>
            </button>
          )
        })}
      </div>

      <div className="mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="ค้นหา topic, คำสั่งงาน..." />
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-500" size={28} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-surface-400 text-sm">ยังไม่มีรายการ</div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              onClick={() => setShowDetail(order)}
              className="bg-white rounded-xl p-4 border border-surface-200 active:scale-[0.98] transition-all cursor-pointer hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {(order as any).topic && <p className="text-[10px] text-brand-600 font-medium mb-0.5">{(order as any).topic}</p>}
                  <h3 className="font-semibold text-sm truncate">{order.order_detail}</h3>
                  {order.remark && <p className="text-xs text-surface-500 mt-1 line-clamp-1">{order.remark}</p>}
                </div>
                <span className="text-[10px] text-surface-400 flex-shrink-0">{order.date}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => { setForm({ date: new Date().toISOString().split('T')[0], topic: '', order_detail: '', status: statusTab, remark: '' }); setEditingOrder(null); setShowAdd(true) }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center active:scale-90 transition-transform z-30"
      >
        <Plus size={24} />
      </button>

      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditingOrder(null) }}
        title={editingOrder ? 'แก้ไขคำสั่งงาน' : 'เพิ่มคำสั่งงาน'}
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
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Topic</label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
              placeholder="หัวข้อ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">คำสั่งงาน</label>
            <textarea
              value={form.order_detail}
              onChange={(e) => setForm(prev => ({ ...prev, order_detail: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm resize-none"
              placeholder="รายละเอียดคำสั่งงาน"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">สถานะ</label>
            <div className="flex gap-2">
              {(['todo', 'doing', 'done'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, status: s }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                    form.status === s
                      ? STATUS_CONFIG[s].color + ' border-current'
                      : 'bg-white border-surface-200 text-surface-500'
                  }`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
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
            disabled={saving || !form.order_detail.trim()}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {editingOrder ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
          </button>
        </div>
      </Modal>

      {showDetail && (
        <div className="fixed inset-0 z-50 bg-white animate-fade-in">
          <div className="max-w-lg mx-auto h-full flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-surface-200">
              <button onClick={() => setShowDetail(null)} className="p-1.5 rounded-lg hover:bg-surface-100">
                <ChevronLeft size={22} />
              </button>
              <h2 className="text-lg font-semibold flex-1 truncate">รายละเอียด</h2>
              <button onClick={() => openEdit(showDetail)} className="p-2 rounded-lg text-surface-400 hover:bg-surface-100">
                <Edit3 size={18} />
              </button>
              <button onClick={() => deleteOrder(showDetail.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50">
                <Trash2 size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <span className="text-xs text-surface-400">วันที่</span>
                <p className="text-sm font-medium mt-0.5">{showDetail.date}</p>
              </div>
              {(showDetail as any).topic && (
                <div>
                  <span className="text-xs text-surface-400">Topic</span>
                  <p className="text-sm font-medium mt-0.5">{(showDetail as any).topic}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-surface-400">คำสั่งงาน</span>
                <p className="text-sm mt-0.5 whitespace-pre-wrap">{showDetail.order_detail}</p>
              </div>
              {showDetail.remark && (
                <div>
                  <span className="text-xs text-surface-400">Remark</span>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">{showDetail.remark}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-surface-400 block mb-2">เปลี่ยนสถานะ</span>
                <div className="flex gap-2">
                  {(['todo', 'doing', 'done'] as const).map(s => {
                    const config = STATUS_CONFIG[s]
                    const Icon = config.icon
                    return (
                      <button
                        key={s}
                        onClick={() => changeStatus(showDetail, s)}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-1.5 ${
                          showDetail.status === s
                            ? config.color + ' border-current'
                            : 'bg-white border-surface-200 text-surface-500 hover:bg-surface-50'
                        }`}
                      >
                        <Icon size={16} />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
