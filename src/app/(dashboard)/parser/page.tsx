'use client'

import { useState, useEffect } from 'react'
import { runParser, getParsingHistory } from '@/actions/parser'
import { CITY_NAMES } from '@/lib/twogis/cities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Search, Loader2 } from 'lucide-react'

interface ParsingTask {
  id: string
  created_at: string
  city: string
  search_query: string
  status: string
  total_found: number
  total_saved: number
  total_duplicates: number
  error_message: string | null
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  running: 'default',
  completed: 'outline',
  failed: 'destructive',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидание',
  running: 'Выполняется',
  completed: 'Завершён',
  failed: 'Ошибка',
}

export default function ParserPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    totalFound?: number
    saved?: number
    duplicates?: number
  } | null>(null)
  const [history, setHistory] = useState<ParsingTask[]>([])
  const [city, setCity] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const res = await getParsingHistory()
    if (res.data) setHistory(res.data)
  }

  async function handleSubmit(formData: FormData) {
    formData.set('city', city)
    setLoading(true)
    setResult(null)

    const res = await runParser(formData)
    setResult(res)
    setLoading(false)
    loadHistory()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Парсер 2GIS</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Новый парсинг</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Город</Label>
              <Select value={city} onValueChange={(v) => setCity(v ?? '')}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  {CITY_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label htmlFor="query">Поисковый запрос</Label>
              <Input
                id="query"
                name="query"
                placeholder="стоматология, салон красоты, клиника..."
                required
              />
            </div>

            <Button type="submit" disabled={loading || !city}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {loading ? 'Парсинг...' : 'Запустить'}
            </Button>
          </form>

          {result && (
            <div
              className={`mt-4 rounded-lg p-3 text-sm ${
                result.error
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {result.error
                ? `Ошибка: ${result.error}`
                : `Найдено: ${result.totalFound}, сохранено: ${result.saved}, дубликатов: ${result.duplicates}`}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">История парсинга</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет задач парсинга.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Запрос</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Найдено</TableHead>
                  <TableHead className="text-right">Сохранено</TableHead>
                  <TableHead className="text-right">Дубликаты</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="text-sm">
                      {new Date(task.created_at).toLocaleString('ru-RU', {
                        timeZone: 'Asia/Almaty',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>{task.city}</TableCell>
                    <TableCell>{task.search_query}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[task.status] ?? 'secondary'}>
                        {STATUS_LABELS[task.status] ?? task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{task.total_found}</TableCell>
                    <TableCell className="text-right">{task.total_saved}</TableCell>
                    <TableCell className="text-right">{task.total_duplicates}</TableCell>
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
