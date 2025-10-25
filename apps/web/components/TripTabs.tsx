'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TripTabs({ id }: { id: string }) {
  const pathname = usePathname()
  const Tab = (slug: 'visa'|'checklist', label: string) => {
    const href = `/trips/${id}/${slug}`
    const active = pathname?.startsWith(href)
    const base = 'px-3 py-1 rounded-md border text-sm'
    const cls = active
      ? `${base} bg-blue-600 text-white border-blue-600`
      : `${base} bg-white hover:bg-gray-50`
    return <Link href={href} className={cls}>{label}</Link>
  }

  return (
    <nav className="flex gap-2 mb-4">
      {Tab('visa','Visa')}
      {Tab('checklist','Checklist')}
      <span className="px-3 py-1 rounded-md border text-sm opacity-50">Timeline (скоро)</span>
      <span className="px-3 py-1 rounded-md border text-sm opacity-50">Budget (скоро)</span>
    </nav>
  )
}
