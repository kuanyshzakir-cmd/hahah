'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getSettings() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('b2b_settings').select('*')

  if (error) return { error: error.message }

  // Convert to a key-value map
  const settings: Record<string, unknown> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.value
  }
  return { data: settings }
}

export async function updateSetting(key: string, value: unknown) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('b2b_settings')
    .upsert({ key, value: JSON.parse(JSON.stringify(value)) })

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}
