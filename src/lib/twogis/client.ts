import { KZ_CITIES } from './cities'
import type { TwoGisResponse, TwoGisItem, ParsedContact } from './types'
import { normalizePhone } from '@/lib/utils/phone'

const BASE_URL = 'https://catalog.api.2gis.ru/3.0/items'
const PAGE_SIZE = 50
const MAX_PAGES = 20 // Safety limit: 1000 contacts max

export interface ParseOptions {
  city: string
  query: string
  maxPages?: number
  onProgress?: (page: number, total: number) => void
}

export interface ParseResult {
  contacts: ParsedContact[]
  totalFound: number
  pagesProcessed: number
}

function extractPhone(item: TwoGisItem): string | null {
  if (!item.contact_groups) return null

  for (const group of item.contact_groups) {
    for (const contact of group.contacts) {
      if (contact.type === 'phone') {
        const normalized = normalizePhone(contact.value)
        if (normalized) return normalized
      }
    }
  }
  return null
}

function extractCategory(item: TwoGisItem): string | null {
  return item.rubrics?.[0]?.name ?? null
}

export async function parseTwoGis({
  city,
  query,
  maxPages = MAX_PAGES,
}: ParseOptions): Promise<ParseResult> {
  const apiKey = process.env.TWOGIS_API_KEY
  if (!apiKey) throw new Error('TWOGIS_API_KEY is not set')

  const regionId = KZ_CITIES[city]
  if (!regionId) throw new Error(`Unknown city: ${city}`)

  const contacts: ParsedContact[] = []
  let totalFound = 0
  let page = 1

  while (page <= maxPages) {
    const url = new URL(BASE_URL)
    url.searchParams.set('q', query)
    url.searchParams.set('region_id', String(regionId))
    url.searchParams.set('page', String(page))
    url.searchParams.set('page_size', String(PAGE_SIZE))
    url.searchParams.set('fields', 'items.contact_groups,items.address,items.reviews')
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString())
    const data: TwoGisResponse = await response.json()

    if (data.meta.code !== 200 || !data.result?.items?.length) {
      break
    }

    totalFound = data.result.total

    for (const item of data.result.items) {
      const phone = extractPhone(item)

      contacts.push({
        external_id: item.id,
        company_name: item.name,
        phone,
        address: item.address_name ?? item.full_address_name ?? null,
        city,
        category: extractCategory(item),
        rating: item.reviews?.general_rating ?? null,
        reviews_count: item.reviews?.general_review_count ?? null,
      })
    }

    // Stop if we've fetched all results
    if (page * PAGE_SIZE >= totalFound) break

    page++

    // Rate limit: 500ms between requests
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return {
    contacts,
    totalFound,
    pagesProcessed: page,
  }
}

export interface MultiParseOptions {
  city: string
  queries: string[]
  maxPages?: number
  minRating?: number
  minReviews?: number
}

export interface MultiParseResult {
  contacts: ParsedContact[]
  totalFound: number
  queriesProcessed: number
}

export async function parseMultipleQueries({
  city,
  queries,
  maxPages = MAX_PAGES,
  minRating,
  minReviews,
}: MultiParseOptions): Promise<MultiParseResult> {
  const seen = new Set<string>()
  const allContacts: ParsedContact[] = []
  let totalFound = 0

  for (const query of queries) {
    const result = await parseTwoGis({ city, query, maxPages })
    totalFound += result.totalFound

    for (const contact of result.contacts) {
      if (seen.has(contact.external_id)) continue
      seen.add(contact.external_id)

      // Apply rating/reviews filters
      if (minRating != null && (contact.rating == null || contact.rating < minRating)) continue
      if (minReviews != null && (contact.reviews_count == null || contact.reviews_count < minReviews)) continue

      allContacts.push(contact)
    }
  }

  return {
    contacts: allContacts,
    totalFound,
    queriesProcessed: queries.length,
  }
}
