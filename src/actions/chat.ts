'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getConversations() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('b2b_conversations')
    .select('*, contact:b2b_contacts(id, company_name, phone, city)')
    .order('last_message_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function getMessages(contactId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('b2b_messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return { error: error.message }
  return { data }
}

export async function sendManualMessage(contactId: string, body: string) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('b2b_messages').insert({
    contact_id: contactId,
    direction: 'outbound',
    message_type: 'text',
    body,
    status: 'sent',
    is_ai_generated: false,
  })

  if (error) return { error: error.message }

  // Update conversation last_message_at
  await supabase
    .from('b2b_conversations')
    .update({ last_message_at: new Date().toISOString(), unread_count: 0 })
    .eq('contact_id', contactId)

  return { success: true }
}

export async function toggleAi(contactId: string, enabled: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('b2b_conversations')
    .update({ ai_enabled: enabled })
    .eq('contact_id', contactId)

  if (error) return { error: error.message }
  return { success: true }
}
