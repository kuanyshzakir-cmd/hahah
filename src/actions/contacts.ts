'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ContactFilters {
  city?: string
  lead_status?: string
  search?: string
  is_blacklisted?: boolean
}

export async function getContacts(filters: ContactFilters = {}) {
  const supabase = createAdminClient()

  let query = supabase
    .from('b2b_contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.city) {
    query = query.eq('city', filters.city)
  }
  if (filters.lead_status) {
    query = query.eq('lead_status', filters.lead_status)
  }
  if (filters.is_blacklisted !== undefined) {
    query = query.eq('is_blacklisted', filters.is_blacklisted)
  }
  if (filters.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query.limit(200)

  if (error) return { error: error.message }
  return { data }
}

export async function getContactById(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('b2b_contacts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { error: error.message }
  return { data }
}

export async function updateContactStatus(id: string, lead_status: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('b2b_contacts')
    .update({ lead_status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/contacts')
  return { success: true }
}

export async function toggleBlacklist(
  id: string,
  blacklist: boolean,
  reason?: string
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('b2b_contacts')
    .update({
      is_blacklisted: blacklist,
      blacklist_reason: blacklist ? reason ?? 'manual' : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/contacts')
  revalidatePath('/blacklist')
  return { success: true }
}

export async function getContactsForExport(filters: ContactFilters = {}) {
  const supabase = createAdminClient()

  let query = supabase
    .from('b2b_contacts')
    .select('company_name, phone, address, city, category, lead_status, lead_score, is_blacklisted, created_at')
    .order('created_at', { ascending: false })

  if (filters.city) query = query.eq('city', filters.city)
  if (filters.lead_status) query = query.eq('lead_status', filters.lead_status)
  if (filters.is_blacklisted !== undefined) query = query.eq('is_blacklisted', filters.is_blacklisted)

  const { data, error } = await query

  if (error) return { error: error.message }
  return { data }
}
