export const dynamic = 'force-dynamic'

import { getDashboardStats } from '@/actions/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare, Megaphone, Search } from 'lucide-react'

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const cards = [
    {
      title: 'Контакты',
      value: stats.totalContacts,
      description: 'Всего в базе',
      icon: Users,
    },
    {
      title: 'Сообщения',
      value: stats.messagesToday,
      description: 'Сегодня',
      icon: MessageSquare,
    },
    {
      title: 'Кампании',
      value: stats.activeCampaigns,
      description: 'Активные',
      icon: Megaphone,
    },
    {
      title: 'Спарсено',
      value: stats.parsedThisWeek,
      description: 'За неделю',
      icon: Search,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
