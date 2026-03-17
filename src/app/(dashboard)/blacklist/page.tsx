'use client'

import { useState, useEffect } from 'react'
import { getContacts, toggleBlacklist } from '@/actions/contacts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Undo2 } from 'lucide-react'

interface Contact {
  id: string
  company_name: string
  phone: string | null
  city: string
  blacklist_reason: string | null
  created_at: string
}

const REASON_LABELS: Record<string, string> = {
  'opt-out': 'Отписался',
  competitor: 'Конкурент',
  already_client: 'Уже клиент',
  manual: 'Вручную',
}

export default function BlacklistPage() {
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    loadBlacklist()
  }, [])

  async function loadBlacklist() {
    const res = await getContacts({ is_blacklisted: true })
    if (res.data) setContacts(res.data)
  }

  async function handleUnblock(id: string) {
    await toggleBlacklist(id, false)
    loadBlacklist()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Чёрный список ({contacts.length})</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Заблокированные контакты</CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Чёрный список пуст.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.company_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {contact.phone ?? '—'}
                    </TableCell>
                    <TableCell>{contact.city}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {REASON_LABELS[contact.blacklist_reason ?? ''] ??
                          contact.blacklist_reason ??
                          'Неизвестно'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(contact.id)}
                      >
                        <Undo2 className="size-3.5" />
                        Разблокировать
                      </Button>
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
