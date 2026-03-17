'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCampaigns, createCampaign } from '@/actions/campaigns'
import { CITY_NAMES } from '@/lib/twogis/cities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

interface Campaign {
  id: string
  created_at: string
  name: string
  template_name: string
  status: string
  total_recipients: number
  total_sent: number
  total_delivered: number
  total_read: number
  total_replied: number
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  sending: 'Отправка',
  paused: 'Пауза',
  completed: 'Завершена',
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  sending: 'default',
  paused: 'destructive',
  completed: 'outline',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    const res = await getCampaigns()
    if (res.data) setCampaigns(res.data)
  }

  async function handleCreate(formData: FormData) {
    const res = await createCampaign(formData)
    if (res.success) {
      setOpen(false)
      loadCampaigns()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Кампании</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={<Button />}
          >
            <Plus className="size-4" />
            Новая кампания
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Создать кампанию</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input id="name" name="name" placeholder="Стоматологии Астана" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template_name">Шаблон WhatsApp</Label>
                <Input
                  id="template_name"
                  name="template_name"
                  placeholder="b2b_cold_intro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Города (зажмите Ctrl для множественного выбора)</Label>
                <select
                  name="target_cities"
                  multiple
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {CITY_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="followup_template_1">Follow-up 1 (день 3)</Label>
                  <Input id="followup_template_1" name="followup_template_1" placeholder="b2b_followup_1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followup_template_2">Follow-up 2 (день 7)</Label>
                  <Input id="followup_template_2" name="followup_template_2" placeholder="b2b_followup_2" />
                </div>
              </div>
              <input type="hidden" name="followup_enabled" value="true" />
              <Button type="submit" className="w-full">
                Создать
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Кампании ещё не созданы.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Шаблон</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Получатели</TableHead>
                  <TableHead className="text-right">Отправлено</TableHead>
                  <TableHead className="text-right">Доставлено</TableHead>
                  <TableHead className="text-right">Прочитано</TableHead>
                  <TableHead className="text-right">Ответили</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="font-medium hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.template_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[campaign.status] ?? 'secondary'}>
                        {STATUS_LABELS[campaign.status] ?? campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{campaign.total_recipients}</TableCell>
                    <TableCell className="text-right">{campaign.total_sent}</TableCell>
                    <TableCell className="text-right">{campaign.total_delivered}</TableCell>
                    <TableCell className="text-right">{campaign.total_read}</TableCell>
                    <TableCell className="text-right">{campaign.total_replied}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(campaign.created_at).toLocaleDateString('ru-RU', {
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
