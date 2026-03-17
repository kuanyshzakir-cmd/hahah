import { getCampaignById, startCampaign, pauseCampaign } from '@/actions/campaigns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { ArrowLeft, Play, Pause } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  sending: 'Отправка',
  paused: 'Пауза',
  completed: 'Завершена',
  pending: 'Ожидание',
  queued: 'В очереди',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  replied: 'Ответил',
  failed: 'Ошибка',
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getCampaignById(id)

  if (result.error || !result.campaign) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Кампания не найдена.</p>
        <Link href="/campaigns">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Назад
          </Button>
        </Link>
      </div>
    )
  }

  const { campaign, contacts } = result

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="outline" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <Badge variant="secondary">{STATUS_LABELS[campaign.status] ?? campaign.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: 'Получатели', value: campaign.total_recipients },
          { label: 'Отправлено', value: campaign.total_sent },
          { label: 'Доставлено', value: campaign.total_delivered },
          { label: 'Прочитано', value: campaign.total_read },
          { label: 'Ответили', value: campaign.total_replied },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {campaign.status === 'draft' && (
          <form action={startCampaign.bind(null, id)}>
            <Button>
              <Play className="size-4" />
              Запустить
            </Button>
          </form>
        )}
        {campaign.status === 'sending' && (
          <form action={pauseCampaign.bind(null, id)}>
            <Button variant="outline">
              <Pause className="size-4" />
              Пауза
            </Button>
          </form>
        )}
        {campaign.status === 'paused' && (
          <form action={startCampaign.bind(null, id)}>
            <Button>
              <Play className="size-4" />
              Продолжить
            </Button>
          </form>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Получатели ({contacts?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!contacts || contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет получателей.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Отправлено</TableHead>
                  <TableHead>FU 1</TableHead>
                  <TableHead>FU 2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((cc: Record<string, unknown>) => {
                  const contact = cc.contact as Record<string, string> | null
                  return (
                    <TableRow key={cc.id as string}>
                      <TableCell className="font-medium">
                        {contact?.company_name ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {contact?.phone ?? '—'}
                      </TableCell>
                      <TableCell>{contact?.city ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {STATUS_LABELS[cc.status as string] ?? (cc.status as string)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cc.sent_at
                          ? new Date(cc.sent_at as string).toLocaleString('ru-RU', {
                              timeZone: 'Asia/Almaty',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell>{cc.followup_1_sent ? 'Да' : '—'}</TableCell>
                      <TableCell>{cc.followup_2_sent ? 'Да' : '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
