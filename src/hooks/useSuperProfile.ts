'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { SuperProfile } from '@/types'

export function useSuperProfile() {
  const [profile, setProfile] = useState<SuperProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('super_profiles')
      .select('*')
      .single()
      .then(({ data }) => {
        setProfile(data as SuperProfile)
        setLoading(false)
      })
  }, [])

  async function updateProfile(updates: Partial<SuperProfile>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('super_profiles')
      .upsert({ ...updates, user_id: user.id })
      .select()
      .single()

    if (!error && data) setProfile(data as SuperProfile)
    return { data, error }
  }

  return { profile, loading, updateProfile }
}
