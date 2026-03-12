'use client'

interface TabBarProps {
  tabs: { key: string; label: string; count?: number }[]
  activeTab: string
  onChange: (key: string) => void
}

export default function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide px-4 py-3">
      <div className="flex gap-1 w-max mx-auto min-w-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.key
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 text-xs ${
                activeTab === tab.key ? 'text-brand-200' : 'text-surface-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
