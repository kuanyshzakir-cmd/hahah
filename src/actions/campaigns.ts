'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getCampaigns() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('b2b_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function getCampaignById(id: string) {
  const supabase = createAdminClient()

  const [campaignRes, contactsRes] = await Promise.all([
    supabase.from('b2b_campaigns').select('*').eq('id', id).single(),
    supabase
      .from('b2b_campaign_contacts')
      .select('*, contact:b2b_contacts(company_name, phone, city)')
      .eq('campaign_id', id)
      .order('sent_at', { ascending: false }),
  ])

  if (campaignRes.error) return { error: campaignRes.error.message }

  return {
    campaign: campaignRes.data,
    contacts: contactsRes.data ?? [],
  }
}

export async function createCampaign(formData: FormData) {
  const supabase = createAdminClient()

  const targetCities = formData.getAll('target_cities') as string[]
  const targetStatuses = formData.getAll('target_statuses') as string[]

  const { data: campaign, error } = await supabase
    .from('b2b_campaigns')
    .insert({
      name: formData.get('name') as string,
      template_name: formData.get('template_name') as string,
      template_params: {},
      target_filter: {
        cities: targetCities.length > 0 ? targetCities : undefined,
        statuses: targetStatuses.length > 0 ? targetStatuses : undefined,
      },
      followup_enabled: formData.get('followup_enabled') === 'true',
      followup_template_1: (formData.get('followup_template_1') as string) || null,
      followup_template_2: (formData.get('followup_template_2') as string) || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Add matching contacts to campaign
  let contactQuery = supabase
    .from('b2b_contacts')
    .select('id')
    .eq('is_blacklisted', false)
    .not('phone', 'is', null)

  if (targetCities.length > 0) {
    contactQuery = contactQuery.in('city', targetCities)
  }
  if (targetStatuses.length > 0) {
    contactQuery = contactQuery.in('lead_status', targetStatuses)
  }

  const { data: contacts } = await contactQuery

  if (contacts && contacts.length > 0) {
    const campaignContacts = contacts.map((c) => ({
      campaign_id: campaign.id,
      contact_id: c.id,
      status: 'pending',
    }))

    await supabase.from('b2b_campaign_contacts').insert(campaignContacts)

    await supabase
      .from('b2b_campaigns')
      .update({ total_recipients: contacts.length })
      .eq('id', campaign.id)
  }

  revalidatePath('/campaigns')
  return { success: true, campaignId: campaign.id }
}

export async function startCampaign(id: string) {
  const supabase = createAdminClient()

  // Update campaign status
  await supabase
    .from('b2b_campaigns')
    .update({ status: 'sending' })
    .eq('id', id)

  // Queue all pending contacts
  await supabase
    .from('b2b_campaign_contacts')
    .update({ status: 'queued' })
    .eq('campaign_id', id)
    .eq('status', 'pending')

  // Trigger n8n webhook to start sending
  const webhookBase = process.env.N8N_WEBHOOK_BASE_URL
  const webhookPath = process.env.N8N_CAMPAIGN_WEBHOOK_PATH

  if (webhookBase && webhookPath) {
    try {
      await fetch(`${webhookBase}/${webhookPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: id }),
      })
    } catch {
      // n8n webhook failure is non-blocking
    }
  }

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${id}`)
}

export async function pauseCampaign(id: string) {
  const supabase = createAdminClient()
  await supabase
    .from('b2b_campaigns')
    .update({ status: 'paused' })
    .eq('id', id)

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${id}`)
}
