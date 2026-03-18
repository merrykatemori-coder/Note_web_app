'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/hooks/useAuth'
import SearchBar from '@/components/SearchBar'
import Modal from '@/components/Modal'
import { Plus, Loader2, Trash2, ChevronLeft, Edit3, Phone, Mail, User2 } from 'lucide-react'

interface Contact {
  id: string
  user_id: string
  name: string
  phone: string
  line_id: string
  email: string
  contact_type: string
  position: string
  company: string
  remark: string
  created_at: string
}

const DEFAULT_TYPES = ['Customer', 'Officer', 'Organization', 'Partner', 'Other']

export default function ContactsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState<Contact | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [saving, setSaving] = useState(false)
  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES)

  const [form, setForm] = useState({
    name: '', phone: '', line_id: '', email: '',
    contact_type: DEFAULT_TYPES[0], position: '', company: '', remark: '',
  })

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    const [contactRes, typeRes] = await Promise.all([
      supabase.from('contacts').select('*').order('name'),
      supabase.from('dropdown_settings').select('value').eq('category', 'contact_type').order('sort_order'),
    ])
    if (contactRes.data) setContacts(contactRes.data)
    if (typeRes.data && typeRes.data.length > 0) {
      const t = typeRes.data.map(d => d.value)
      setTypes(t)
      setForm(prev => ({ ...prev, contact_type: t[0] }))
    }
    setLoading(false)
  }

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.contact_type.toLowerCase().includes(q) ||
      c.position.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.line_id.toLowerCase().includes(q)
    )
  }, [contacts, search])

  const resetForm = () => {
    setForm({ name: '', phone: '', line_id: '', email: '', contact_type: types[0], position: '', company: '', remark: '' })
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !user) return
    setSaving(true)

    if (editingContact) {
      const { error } = await supabase.from('contacts').update(form).eq('id', editingContact.id)
      if (!error) {
        setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...form } : c))
        setEditingContact(null)
        setShowDetail(null)
      }
    } else {
      const { data } = await supabase.from('contacts').insert({ ...form, user_id: user.id }).select().single()
      if (data) setContacts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }

    resetForm()
    setShowAdd(false)
    setSaving(false)
  }

  const deleteContact = async (id: string) => {
    if (!confirm('ลบรายชื่อนี้?')) return
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
    setShowDetail(null)
  }

  const openEdit = (contact: Contact) => {
    setEditingContact(contact)
    setForm({
      name: contact.name, phone: contact.phone, line_id: contact.line_id, email: contact.email,
      contact_type: contact.contact_type, position: contact.position, company: contact.company, remark: contact.remark,
    })
    setShowAdd(true)
    setShowDetail(null)
  }

  const typeColor = (t: string) => {
    const colors: Record<string, string> = {
      Customer: 'bg-green-50 text-green-700',
      Officer: 'bg-blue-50 text-blue-700',
      Organization: 'bg-purple-50 text-purple-700',
      Partner: 'bg-orange-50 text-orange-700',
    }
    return colors[t] || 'bg-surface-100 text-surface-600'
  }

  if (!user) return null

  return (
    <div className="animate-fade-in">
      <div className="px-4 py-3">
        <h2 className="text-lg font-bold">Contacts</h2>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="ค้นหาชื่อ, เบอร์, บริษัท..." />

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-500" size={28} />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-surface-400 text-sm">ยังไม่มีรายชื่อ</div>
        ) : (
          filteredContacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => setShowDetail(contact)}
              className="bg-white rounded-xl p-4 border border-surface-200 active:scale-[0.98] transition-all cursor-pointer hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <User2 size={18} className="text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{contact.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColor(contact.contact_type)}`}>
                      {contact.contact_type}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">{contact.phone}</p>
                  {contact.company && <p className="text-[10px] text-surface-400">{contact.company}{contact.position ? ` · ${contact.position}` : ''}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => { resetForm(); setEditingContact(null); setShowAdd(true) }}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center active:scale-90 transition-transform z-30"
      >
        <Plus size={24} />
      </button>

      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditingContact(null) }}
        title={editingContact ? 'แก้ไขรายชื่อ' : 'เพิ่มรายชื่อ'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">ชื่อ *</label>
            <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm" placeholder="ชื่อ-นามสกุล" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">เบอร์โทร *</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm" placeholder="0xx-xxx-xxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Type</label>
            <select value={form.contact_type} onChange={(e) => setForm(prev => ({ ...prev, contact_type: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm appearance-none">
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Position</label>
              <input type="text" value={form.position} onChange={(e) => setForm(prev => ({ ...prev, position: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm" placeholder="ตำแหน่ง" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Company</label>
              <input type="text" value={form.company} onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm" placeholder="บริษัท" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">LINE ID</label>
            <input type="text" value={form.line_id} onChange={(e) => setForm(prev => ({ ...prev, line_id: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm" placeholder="LINE ID (ถ้ามี)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm" placeholder="email (ถ้ามี)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Remark</label>
            <textarea value={form.remark} onChange={(e) => setForm(prev => ({ ...prev, remark: e.target.value }))} rows={2} className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm resize-none" placeholder="หมายเหตุ" />
          </div>
          <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.phone.trim()} className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 size={18} className="animate-spin" />}
            {editingContact ? 'บันทึกการแก้ไข' : 'เพิ่มรายชื่อ'}
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
              <h2 className="text-lg font-semibold flex-1 truncate">{showDetail.name}</h2>
              <button onClick={() => openEdit(showDetail)} className="p-2 rounded-lg text-surface-400 hover:bg-surface-100">
                <Edit3 size={18} />
              </button>
              <button onClick={() => deleteContact(showDetail.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50">
                <Trash2 size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center">
                  <User2 size={36} className="text-brand-500" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold">{showDetail.name}</h3>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${typeColor(showDetail.contact_type)}`}>
                  {showDetail.contact_type}
                </span>
              </div>

              <div className="space-y-3 bg-surface-50 rounded-xl p-4">
                <a href={`tel:${showDetail.phone}`} className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-brand-500" />
                  <span className="text-brand-600 font-medium">{showDetail.phone}</span>
                </a>
                {showDetail.email && (
                  <a href={`mailto:${showDetail.email}`} className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-brand-500" />
                    <span className="text-brand-600">{showDetail.email}</span>
                  </a>
                )}
                {showDetail.line_id && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-brand-500 text-xs font-bold w-4 text-center">L</span>
                    <span>{showDetail.line_id}</span>
                  </div>
                )}
              </div>

              {(showDetail.company || showDetail.position) && (
                <div className="space-y-2">
                  {showDetail.company && (
                    <div>
                      <span className="text-xs text-surface-400">Company</span>
                      <p className="text-sm font-medium">{showDetail.company}</p>
                    </div>
                  )}
                  {showDetail.position && (
                    <div>
                      <span className="text-xs text-surface-400">Position</span>
                      <p className="text-sm font-medium">{showDetail.position}</p>
                    </div>
                  )}
                </div>
              )}

              {showDetail.remark && (
                <div>
                  <span className="text-xs text-surface-400">Remark</span>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">{showDetail.remark}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
