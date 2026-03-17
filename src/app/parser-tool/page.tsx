'use client'

import { useState } from 'react'

interface Contact {
  external_id: string
  company_name: string
  phone: string | null
  address: string | null
  city: string
  category: string | null
  rating: number | null
  reviews_count: number | null
}

type SortKey = keyof Contact
type SortDir = 'asc' | 'desc'

export default function ParserToolPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('rating')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [totalFound, setTotalFound] = useState(0)

  async function handleParse() {
    setLoading(true)
    setError(null)
    setContacts([])
    setProgress('Парсинг... это может занять 1-2 минуты')

    try {
      const res = await fetch('/api/parser-tool', { method: 'POST' })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setContacts(data.contacts)
      setTotalFound(data.totalFound)
      setProgress('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка запроса')
    } finally {
      setLoading(false)
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'rating' || key === 'reviews_count' ? 'desc' : 'asc')
    }
  }

  const sorted = [...contacts].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function exportCsv() {
    const headers = ['№', 'Название', 'Телефон', 'Адрес', 'Категория', 'Рейтинг', 'Отзывы']
    const rows = sorted.map((c, i) => [
      i + 1,
      c.company_name,
      c.phone ?? '',
      c.address ?? '',
      c.category ?? '',
      c.rating ?? '',
      c.reviews_count ?? '',
    ])

    const escape = (v: string | number) => {
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }

    const csv = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `2gis_med_astana_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Парсер мед. учреждений — Астана
      </h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        Стоматологии, клиники, косметологии, салоны красоты, оптики, лаборатории.
        Фильтр: рейтинг ≥ 4.5, отзывов ≥ 30.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={handleParse}
          disabled={loading}
          style={{
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: loading ? '#999' : '#2563eb',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Парсинг...' : '🔍 Спарсить'}
        </button>

        {contacts.length > 0 && (
          <button
            onClick={exportCsv}
            style={{
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#2563eb',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            📥 Скачать CSV
          </button>
        )}

        {contacts.length > 0 && (
          <span style={{ fontSize: 14, color: '#666' }}>
            Найдено: {contacts.length} (всего в 2GIS: {totalFound})
          </span>
        )}

        {progress && <span style={{ fontSize: 14, color: '#2563eb' }}>{progress}</span>}
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
          Ошибка: {error}
        </div>
      )}

      {contacts.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <Th>№</Th>
                <Th onClick={() => handleSort('company_name')} style={{ cursor: 'pointer', minWidth: 200 }}>
                  Название{arrow('company_name')}
                </Th>
                <Th onClick={() => handleSort('phone')} style={{ cursor: 'pointer', minWidth: 140 }}>
                  Телефон{arrow('phone')}
                </Th>
                <Th onClick={() => handleSort('address')} style={{ cursor: 'pointer', minWidth: 200 }}>
                  Адрес{arrow('address')}
                </Th>
                <Th onClick={() => handleSort('category')} style={{ cursor: 'pointer', minWidth: 140 }}>
                  Категория{arrow('category')}
                </Th>
                <Th onClick={() => handleSort('rating')} style={{ cursor: 'pointer', minWidth: 80 }}>
                  Рейтинг{arrow('rating')}
                </Th>
                <Th onClick={() => handleSort('reviews_count')} style={{ cursor: 'pointer', minWidth: 80 }}>
                  Отзывы{arrow('reviews_count')}
                </Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.external_id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <Td style={{ color: '#999', textAlign: 'center' }}>{i + 1}</Td>
                  <Td style={{ fontWeight: 500 }}>{c.company_name}</Td>
                  <Td>{c.phone ?? '—'}</Td>
                  <Td style={{ color: '#666' }}>{c.address ?? '—'}</Td>
                  <Td>
                    <span style={{
                      background: '#f0fdf4',
                      color: '#166534',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                    }}>
                      {c.category ?? '—'}
                    </span>
                  </Td>
                  <Td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {c.rating != null ? `⭐ ${c.rating}` : '—'}
                  </Td>
                  <Td style={{ textAlign: 'center' }}>{c.reviews_count ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && contacts.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999', fontSize: 14 }}>
          Нажмите «Спарсить» чтобы начать
        </div>
      )}
    </div>
  )
}

function Th({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      style={{
        padding: '10px 12px',
        textAlign: 'left',
        fontWeight: 600,
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        userSelect: 'none',
        ...props.style,
      }}
    >
      {children}
    </th>
  )
}

function Td({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      style={{
        padding: '8px 12px',
        ...props.style,
      }}
    >
      {children}
    </td>
  )
}
