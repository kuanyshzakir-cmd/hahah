'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getConversations } from '@/actions/chat'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Bot } from 'lucide-react'

interface Conversation {
  id: string
  contact_id: string
  last_message_at: string | null
  unread_count: number
  ai_enabled: boolean
  needs_attention: boolean
  language: string
  contact: {
    id: string
    company_name: string
    phone: string | null
    city: string
  } | null
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    const res = await getConversations()
    if (res.data) setConversations(res.data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Чат</h1>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <MessageSquare className="size-8" />
              <p>Диалогов пока нет.</p>
              <p className="text-sm">Они появятся когда клиенты начнут отвечать на рассылки.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link key={conv.id} href={`/chat/${conv.contact_id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {conv.contact?.company_name ?? 'Неизвестный'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {conv.contact?.city} &middot; {conv.contact?.phone ?? 'Нет телефона'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.ai_enabled && (
                      <Badge variant="outline" className="gap-1">
                        <Bot className="size-3" />
                        AI
                      </Badge>
                    )}
                    {conv.needs_attention && (
                      <Badge variant="destructive">Внимание</Badge>
                    )}
                    {conv.unread_count > 0 && (
                      <Badge>{conv.unread_count}</Badge>
                    )}
                    {conv.last_message_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.last_message_at).toLocaleString('ru-RU', {
                          timeZone: 'Asia/Almaty',
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
