'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { getMessages, sendManualMessage, toggleAi } from '@/actions/chat'
import { getContactById } from '@/actions/contacts'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Bot, BotOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Message {
  id: string
  created_at: string
  direction: string
  message_type: string
  body: string | null
  status: string
  is_ai_generated: boolean
}

interface Contact {
  id: string
  company_name: string
  phone: string | null
  city: string
}

export default function ChatConversationPage() {
  const params = useParams()
  const contactId = params.contactId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [input, setInput] = useState('')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()

    // Realtime subscription for new messages
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'b2b_messages',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contactId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadData() {
    const [messagesRes, contactRes] = await Promise.all([
      getMessages(contactId),
      getContactById(contactId),
    ])
    if (messagesRes.data) setMessages(messagesRes.data)
    if (contactRes.data) setContact(contactRes.data)
  }

  async function handleSend() {
    if (!input.trim()) return
    setSending(true)
    const body = input.trim()
    setInput('')

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        direction: 'outbound',
        message_type: 'text',
        body,
        status: 'sent',
        is_ai_generated: false,
      },
    ])

    await sendManualMessage(contactId, body)
    setSending(false)
  }

  async function handleToggleAi() {
    const newState = !aiEnabled
    setAiEnabled(newState)
    await toggleAi(contactId, newState)
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/chat">
          <Button variant="outline" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <p className="font-bold">{contact?.company_name ?? 'Загрузка...'}</p>
          <p className="text-sm text-muted-foreground">
            {contact?.city} &middot; {contact?.phone}
          </p>
        </div>
        <div className="ml-auto">
          <Button
            variant={aiEnabled ? 'outline' : 'secondary'}
            size="sm"
            onClick={handleToggleAi}
          >
            {aiEnabled ? (
              <>
                <Bot className="size-3.5" />
                AI включён
              </>
            ) : (
              <>
                <BotOff className="size-3.5" />
                AI выключен
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Нет сообщений.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
              )}
            >
              <Card
                className={cn(
                  'max-w-md px-4 py-2',
                  msg.direction === 'outbound'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm">{msg.body}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs opacity-60">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                      timeZone: 'Asia/Almaty',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {msg.is_ai_generated && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[10px] opacity-60"
                    >
                      AI
                    </Badge>
                  )}
                </div>
              </Card>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t pt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Написать сообщение..."
          disabled={sending}
        />
        <Button onClick={handleSend} disabled={sending || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
