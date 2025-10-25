import TripTabs from '@/components/TripTabs'

export const dynamic = 'force-dynamic'

export default function TripLayout({
  children, params,
}: { children: React.ReactNode; params: { id: string } }) {
  return (
    <section className="max-w-3xl mx-auto p-4 font-[system-ui]">
      <TripTabs id={params.id} />
      {children}
    </section>
  )
}
