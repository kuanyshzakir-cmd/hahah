'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getDashboardStats() {
  const supabase = createAdminClient()

  const today = new Date().toISOString().slice(0, 10)

  const [contacts, messagesToday, activeCampaigns, parsedWeek] = await Promise.all([
    supabase.from('b2b_contacts').select('id', { count: 'exact', head: true }),
    supabase
      .from('b2b_messages')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`),
    supabase
      .from('b2b_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sending'),
    supabase
      .from('b2b_parsing_tasks')
      .select('total_saved')
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const parsedTotal = (parsedWeek.data ?? []).reduce(
    (sum, t) => sum + (t.total_saved ?? 0),
    0
  )

  return {
    totalContacts: contacts.count ?? 0,
    messagesToday: messagesToday.count ?? 0,
    activeCampaigns: activeCampaigns.count ?? 0,
    parsedThisWeek: parsedTotal,
  }
}
