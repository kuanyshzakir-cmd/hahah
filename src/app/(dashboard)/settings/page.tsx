'use client'

import { useState, useEffect } from 'react'
import { getSettings, updateSetting } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Check } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const res = await getSettings()
    if (res.data) setSettings(res.data)
  }

  async function handleSave(key: string, value: unknown) {
    const res = await updateSetting(key, value)
    if (res.success) {
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Настройки</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI-бот</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Системный промпт</Label>
            <Textarea
              rows={5}
              defaultValue={String(settings.ai_system_prompt ?? '')}
              onBlur={(e) => handleSave('ai_system_prompt', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Модель</Label>
              <Input
                defaultValue={String(settings.ai_model ?? 'gpt-4.1')}
                onBlur={(e) => handleSave('ai_model', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                defaultValue={String(settings.ai_temperature ?? 0.7)}
                onBlur={(e) =>
                  handleSave('ai_temperature', parseFloat(e.target.value))
                }
              />
            </div>
          </div>
          {saved === 'ai_system_prompt' || saved === 'ai_model' || saved === 'ai_temperature' ? (
            <p className="flex items-center gap-1 text-sm text-green-600">
              <Check className="size-3.5" />
              Сохранено
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Бизнес-информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>JSON конфигурация</Label>
            <Textarea
              rows={4}
              defaultValue={JSON.stringify(settings.business_info ?? {}, null, 2)}
              onBlur={(e) => {
                try {
                  handleSave('business_info', JSON.parse(e.target.value))
                } catch {
                  // Invalid JSON, ignore
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Формат: {`{"name": "Dariger", "type": "Медицинская одежда", "cities": [...]}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Окно отправки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>JSON конфигурация</Label>
            <Textarea
              rows={3}
              defaultValue={JSON.stringify(settings.send_window ?? {}, null, 2)}
              onBlur={(e) => {
                try {
                  handleSave('send_window', JSON.parse(e.target.value))
                } catch {
                  // Invalid JSON, ignore
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Формат: {`{"start": "09:00", "end": "18:00", "timezone": "Asia/Almaty", "days": ["mon","tue","wed","thu","fri"]}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Telegram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chat ID</Label>
            <Input
              defaultValue={String(settings.telegram_chat_id ?? '')}
              onBlur={(e) => handleSave('telegram_chat_id', e.target.value)}
              placeholder="Ваш Telegram chat_id для уведомлений"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Follow-up интервалы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>JSON конфигурация</Label>
            <Textarea
              rows={2}
              defaultValue={JSON.stringify(settings.followup_intervals ?? {}, null, 2)}
              onBlur={(e) => {
                try {
                  handleSave('followup_intervals', JSON.parse(e.target.value))
                } catch {
                  // Invalid JSON, ignore
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Формат: {`{"followup_1_days": 3, "followup_2_days": 7}`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
