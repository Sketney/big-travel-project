'use client'
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TripIndexRedirect() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  useEffect(() => {
    if (id) router.replace(`/trips/${id}/visa`)
  }, [id, router])
  return null
}
