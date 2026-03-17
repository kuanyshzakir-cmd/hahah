import { NextResponse } from 'next/server'
import { parseTwoGis } from '@/lib/twogis/client'
import type { ParsedContact } from '@/lib/twogis/types'

const CITY = 'Астана'
const MIN_RATING = 4.5
const MIN_REVIEWS = 30
const MAX_PAGES = 2 // 2 pages × 50 = 100 per category

const MEDICAL_QUERIES = [
  'стоматология',
  'частная клиника',
  'косметология',
  'медицинский центр',
  'салон красоты',
]

export async function POST() {
  try {
    const seen = new Set<string>()
    const allContacts: ParsedContact[] = []
    let totalFound = 0

    for (const query of MEDICAL_QUERIES) {
      const result = await parseTwoGis({ city: CITY, query, maxPages: MAX_PAGES })
      totalFound += result.totalFound

      for (const contact of result.contacts) {
        if (seen.has(contact.external_id)) continue
        seen.add(contact.external_id)

        if (contact.rating == null || contact.rating < MIN_RATING) continue
        if (contact.reviews_count == null || contact.reviews_count < MIN_REVIEWS) continue

        allContacts.push(contact)
      }
    }

    return NextResponse.json({
      contacts: allContacts,
      totalFound,
      filtered: allContacts.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
