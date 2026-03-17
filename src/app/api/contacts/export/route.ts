import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { contactsToCsv } from '@/lib/utils/export'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const city = searchParams.get('city')
  const status = searchParams.get('status')

  const supabase = createAdminClient()

  let query = supabase
    .from('b2b_contacts')
    .select(
      'company_name, phone, address, city, category, lead_status, lead_score, is_blacklisted, created_at'
    )
    .eq('is_blacklisted', false)
    .order('created_at', { ascending: false })

  if (city) query = query.eq('city', city)
  if (status) query = query.eq('lead_status', status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const csv = contactsToCsv(data ?? [])

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contacts_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
