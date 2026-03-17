import * as fs from 'fs'
import * as path from 'path'

const API_KEY = '122ff1c7-18ef-4dac-b6b2-e272c5917bd0'
const REGION_ID = 68 // Астана
const BASE_URL = 'https://catalog.api.2gis.ru/3.0/items'
const PAGE_SIZE = 10 // demo key limit
const MAX_PAGES = 10 // 10 pages × 10 = 100 per category
const MIN_RATING = 4.5
const MIN_REVIEWS = 30

const QUERIES = [
  'стоматология',
  'частная клиника',
  'косметология',
  'медицинский центр',
  'салон красоты',
]

interface Contact {
  id: string
  name: string
  address: string
  category: string
  rating: number
  reviews: number
}

async function fetchPage(query: string, page: number): Promise<{ items: any[]; total: number }> {
  const url = new URL(BASE_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('region_id', String(REGION_ID))
  url.searchParams.set('page', String(page))
  url.searchParams.set('page_size', String(PAGE_SIZE))
  url.searchParams.set('fields', 'items.reviews,items.contact_groups,items.address')
  url.searchParams.set('key', API_KEY)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.meta?.code !== 200) {
    console.log(`  ⚠ API вернул код ${data.meta?.code}: ${data.meta?.error?.message || 'unknown'}`)
    return { items: [], total: 0 }
  }

  return {
    items: data.result?.items || [],
    total: data.result?.total || 0,
  }
}

async function main() {
  console.log('🔍 Парсинг мед. учреждений Астаны из 2GIS')
  console.log(`   Фильтр: рейтинг ≥ ${MIN_RATING}, отзывов ≥ ${MIN_REVIEWS}`)
  console.log('')

  const seen = new Set<string>()
  const contacts: Contact[] = []

  for (const query of QUERIES) {
    process.stdout.write(`📋 "${query}" ... `)

    let categoryCount = 0

    for (let page = 1; page <= MAX_PAGES; page++) {
      const { items, total } = await fetchPage(query, page)

      if (items.length === 0) break

      for (const item of items) {
        if (seen.has(item.id)) continue
        seen.add(item.id)

        const rating = item.reviews?.general_rating
        const reviewCount = item.reviews?.general_review_count

        if (rating == null || rating < MIN_RATING) continue
        if (reviewCount == null || reviewCount < MIN_REVIEWS) continue

        contacts.push({
          id: item.id,
          name: item.name,
          address: item.address_name || item.full_name || '',
          category: query,
          rating,
          reviews: reviewCount,
        })
        categoryCount++
      }

      if (page * PAGE_SIZE >= total) break

      // Rate limit
      await new Promise(r => setTimeout(r, 500))
    }

    console.log(`${categoryCount} шт.`)
  }

  console.log('')
  console.log(`✅ Итого: ${contacts.length} учреждений (рейтинг ≥ ${MIN_RATING}, отзывов ≥ ${MIN_REVIEWS})`)
  console.log('')

  // Sort by rating desc
  contacts.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)

  // Print table
  console.log('─'.repeat(100))
  console.log(
    '№'.padEnd(4) +
    'Название'.padEnd(40) +
    'Адрес'.padEnd(30) +
    'Категория'.padEnd(18) +
    'Рейтинг'.padEnd(8) +
    'Отзывы'
  )
  console.log('─'.repeat(100))

  contacts.forEach((c, i) => {
    console.log(
      String(i + 1).padEnd(4) +
      c.name.slice(0, 38).padEnd(40) +
      c.address.slice(0, 28).padEnd(30) +
      c.category.slice(0, 16).padEnd(18) +
      String(c.rating).padEnd(8) +
      String(c.reviews)
    )
  })

  console.log('─'.repeat(100))

  // Save CSV
  const csvHeader = '№,Название,Адрес,Категория,Рейтинг,Отзывы'
  const csvRows = contacts.map((c, i) => {
    const esc = (s: string) => {
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }
    return `${i + 1},${esc(c.name)},${esc(c.address)},${esc(c.category)},${c.rating},${c.reviews}`
  })

  const csv = '\uFEFF' + csvHeader + '\n' + csvRows.join('\n')
  const outDir = path.join(__dirname, '..', 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'medical_astana.csv')
  fs.writeFileSync(outPath, csv, 'utf-8')

  console.log('')
  console.log(`📥 CSV сохранён: ${outPath}`)
}

main().catch(console.error)
