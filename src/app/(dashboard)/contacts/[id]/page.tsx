import { getContactById } from '@/actions/contacts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  contacted: 'Связались',
  responding: 'Отвечает',
  qualified: 'Квалифицирован',
  not_interested: 'Не интересует',
  converted: 'Конвертирован',
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: contact, error } = await getContactById(id)

  if (error || !contact) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Контакт не найден.</p>
        <Link href="/contacts">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Назад
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contacts">
          <Button variant="outline" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{contact.company_name}</h1>
        {contact.is_blacklisted && (
          <Badge variant="destructive">Чёрный список</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Телефон</span>
              <span className="font-mono">{contact.phone ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Город</span>
              <span>{contact.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Адрес</span>
              <span className="text-right max-w-xs">{contact.address ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Категория</span>
              <span>{contact.category ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Статус</span>
              <Badge variant="secondary">
                {STATUS_LABELS[contact.lead_status] ?? contact.lead_status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lead Score</span>
              <span className="font-bold">{contact.lead_score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WhatsApp</span>
              <Badge variant={contact.wa_status === 'valid' ? 'outline' : 'secondary'}>
                {contact.wa_status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contact.phone && (
              <Link href={`/chat/${contact.id}`} className="block">
                <Button className="w-full" variant="outline">
                  <MessageSquare className="size-4" />
                  Открыть чат
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
