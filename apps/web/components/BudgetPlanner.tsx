'use client'
import { useState } from 'react'

export default function BudgetPlanner() {
  const [items, setItems] = useState([
    { category: 'Flight', amount: 400 },
    { category: 'Accommodation', amount: 600 },
    { category: 'Food', amount: 250 },
    { category: 'Transport', amount: 100 },
    { category: 'Entertainment', amount: 150 },
    { category: 'Insurance', amount: 50 },
  ])
  const update = (i: number, v: string) => {
    const next = [...items]; next[i].amount = parseFloat(v) || 0; setItems(next)
  }
  const total = items.reduce((s, it) => s + it.amount, 0)
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Budget Planner</h2>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="w-40">{it.category}</span>
            <input type="number" value={it.amount} onChange={(e)=>update(i, e.target.value)}
              className="w-32 border border-gray-300 rounded px-2 py-1"/>
          </div>
        ))}
      </div>
      <div className="text-xl font-bold">Total: ${total.toFixed(2)}</div>
    </div>
  )
}
