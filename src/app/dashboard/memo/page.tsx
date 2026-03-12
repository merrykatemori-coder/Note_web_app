'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/hooks/useAuth'
import TabBar from '@/components/TabBar'
import SearchBar from '@/components/SearchBar'
import Modal from '@/components/Modal'
import { Plus, Pin, ChevronLeft, Trash2, Edit3, Loader2, ExternalLink } from 'lucide-react'
import type { Memo } from '@/lib/types'

const DEFAULT_TABS = ['Office', 'Hs Cargo', 'EOS', 'Mori', 'Tolun', 'Personal']

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('http') ? part : `https://${part}`
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 underline inline-flex items-center gap-0.5 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part.length > 40 ? part.substring(0, 40) + '...' : part}
          <ExternalLink size={12} />
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function MemoPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState<Memo | null>(null)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [form, setForm] = useState({ topic: '', details: '' })
  const [saving, setSaving] = useState(false)
  const [tabs, setTabs] = useState<string[]>(DEFAULT_TABS)
  const [tabsLoaded, setTabsLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    const [tabRes, memoRes] = await Promise.all([
      supabase
        .from('dropdown_settings')
        .select('value')
        .eq('user_id', user!.id)
        .eq('category', 'memo_brand')
        .order('sort_order'),
      supabase
        .from('memos')
        .select('*')
        .eq('user_id', user!.id)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    if (tabRes.data && tabRes.data.length > 0) {
      const uniqueTabs = [...new Set(tabRes.data.map(d => d.value))]
      setTabs(uniqueTabs)
      if (!activeTab) setActiveTab(uniqueTabs[0])
    } else {
      setTabs(DEFAULT_TABS)
      if (!activeTab) setActiveTab(DEFAULT_TABS[0])
    }
    setTabsLoaded(true)

    if (memoRes.data) setMemos(memoRes.data)
    setLoading(false)
  }

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key)
  }, [])

  const filteredMemos = useMemo(() => {
    let result = memos.filter(m => m.tab === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.topic.toLowerCase().includes(q) ||
        m.details.toLowerCase().includes(q) ||
        m.tab.toLowerCase().includes(q)
      )
    }
    return result
  }, [memos, activeTab, search])

  const handleSave = async () => {
    if (!form.topic.trim() || !user) return
    setSaving(true)

    if (editingMemo) {
      const { error } = await supabase
        .from('memos')
        .update({
          topic: form.topic,
          details: form.details,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingMemo.id)

      if (!error) {
        setMemos(prev => prev.map(m => m.id === editingMemo.id ? { ...m, ...form, updated_at: new Date().toISOString() } : m))
        setEditingMemo(null)
        setShowDetail(null)
      }
    } else {
      const { data, error } = await supabase
        .from('memos')
        .insert({
          user_id: user.id,
          tab: activeTab,
          topic: form.topic,
          details: form.details,
          pinned: false,
        })
        .select()
        .single()

      if (data) setMemos(prev => [data, ...prev])
    }

    setForm({ topic: '', details: '' })
    setShowAdd(false)
    setSaving(false)
  }

  const togglePin = async (memo: Memo) => {
    const newPinned = !memo.pinned
    await supabase.from('memos').update({ pinned: newPinned }).eq('id', memo.id)
    setMemos(prev => {
      const updated = prev.map(m => m.id === memo.id ? { ...m, pinned: newPinned } : m)
      return updated.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    })
    if (showDetail?.id === memo.id) {
      setShowDetail({ ...memo, pinned: newPinned })
    }
  }

  const deleteMemo = async (id: string) => {
    if (!confirm('ลบรายการนี้?')) return
    await supabase.from('memos').delete().eq('id', id)
    setMemos(prev => prev.filter(m => m.id !== id))
    setShowDetail(null)
  }

  const openEdit = (memo: Memo) => {
    setEditingMemo(memo)
    setForm({ topic: memo.topic, details: memo.details })
    setShowAdd(true)
    setShowDetail(null)
  }

  if (!user || !tabsLoaded) return null

  return (
    <div className="animate-fade-in">
      <TabBar
        tabs={tabs.map(t => ({ key: t, label: t }))}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      <SearchBar value={search} onChange={setSearch} placeholder="ค้นหา topic, details..." />

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-500" size={28} />
          </div>
        ) : filteredMemos.length === 0 ? (
          <div className="text-center py-12 text-surface-400 text-sm">
            ยังไม่มีรายการ
          </div>
        ) : (
          filteredMemos.map(memo => (
            <div
              key={memo.id}
              onClick={() => setShowDetail(memo)}
              className="bg-white rounded-xl p-4 border border-surface-200 active:scale-[0.98] transition-all cursor-pointer hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {memo.pinned && <Pin size={14} className="text-brand-500 flex-shrink-0" />}
                    <h3 className="font-semibold text-sm truncate">{memo.topic}</h3>
                  </div>
                  <p className="text-xs text-surface-500 mt-1 line-clamp-2">{memo.details}</p>
                </div>
                <span className="text-[10px] text-surface-400 flex-shrink-0">
                  {new Date(memo.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => { setForm({ topic: '', details: '' }); setEditingMemo(null); setShowAdd(true) }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center active:scale-90 transition-transform z-30"
      >
        <Plus size={24} />
      </button>

      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditingMemo(null) }}
        title={editingMemo ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}
      >
        <div className="space-y-4">
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
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Details</label>
            <textarea
              value={form.details}
              onChange={(e) => setForm(prev => ({ ...prev, details: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm resize-none"
              placeholder="รายละเอียด"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.topic.trim()}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {editingMemo ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
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
              <h2 className="text-lg font-semibold flex-1 truncate">{showDetail.topic}</h2>
              <button
                onClick={() => togglePin(showDetail)}
                className={`p-2 rounded-lg ${showDetail.pinned ? 'text-brand-600 bg-brand-50' : 'text-surface-400 hover:bg-surface-100'}`}
              >
                <Pin size={18} />
              </button>
              <button onClick={() => openEdit(showDetail)} className="p-2 rounded-lg text-surface-400 hover:bg-surface-100">
                <Edit3 size={18} />
              </button>
              <button onClick={() => deleteMemo(showDetail.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50">
                <Trash2 size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-medium">{showDetail.tab}</span>
                <span className="text-xs text-surface-400">
                  {new Date(showDetail.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">
                {linkifyText(showDetail.details)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
