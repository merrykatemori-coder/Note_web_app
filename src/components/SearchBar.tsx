'use client'

import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = 'ค้นหา...' }: SearchBarProps) {
  return (
    <div className="relative px-4">
      <Search size={18} className="absolute left-7 top-1/2 -translate-y-1/2 text-surface-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-200 bg-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-7 top-1/2 -translate-y-1/2 text-surface-400 p-0.5"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
