'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getContacts, type ContactFilters } from '@/actions/contacts'
import { CITY_NAMES } from '@/lib/twogis/cities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, Search } from 'lucide-react'

interface Contact {
  id: string
  company_name: string
  phone: string | null
  city: string
  category: string | null
  lead_status: string
  lead_score: number
  is_blacklisted: boolean
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  contacted: 'Связались',
  responding: 'Отвечает',
  qualified: 'Квалифицирован',
  not_interested: 'Не интересует',
  converted: 'Конвертирован',
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'secondary',
  contacted: 'default',
  responding: 'default',
  qualified: 'outline',
  not_interested: 'destructive',
  converted: 'outline',
}

const ALL_VALUE = '__all__'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ContactFilters>({})
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    loadContacts()
  }, [filters])

  async function loadContacts() {
    setLoading(true)
    const res = await getContacts(filters)
    if (res.data) setContacts(res.data)
    setLoading(false)
  }

  function handleSearch() {
    setFilters((f) => ({ ...f, search: searchInput || undefined }))
  }

  function exportCsv() {
    const params = new URLSearchParams()
    if (filters.city) params.set('city', filters.city)
    if (filters.lead_status) params.set('status', filters.lead_status)
    window.open(`/api/contacts/export?${params.toString()}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Контакты ({contacts.length})</h1>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" />
          Экспорт CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Город</span>
              <Select
                value={filters.city ?? ALL_VALUE}
                onValueChange={(v) => {
                  const city = (!v || v === ALL_VALUE) ? undefined : v
                  setFilters((f) => ({ ...f, city }))
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Все города</SelectItem>
                  {CITY_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Статус</span>
              <Select
                value={filters.lead_status ?? ALL_VALUE}
                onValueChange={(v) => {
                  const lead_status = (!v || v === ALL_VALUE) ? undefined : v
                  setFilters((f) => ({ ...f, lead_status }))
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Все статусы</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Поиск по названию или телефону..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Контакты не найдены.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Скор</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium hover:underline"
                      >
                        {contact.company_name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {contact.phone ?? '—'}
                    </TableCell>
                    <TableCell>{contact.city}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.category ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[contact.lead_status] ?? 'secondary'}>
                        {STATUS_LABELS[contact.lead_status] ?? contact.lead_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{contact.lead_score}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString('ru-RU', {
                        timeZone: 'Asia/Almaty',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
