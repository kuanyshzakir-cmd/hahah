export function contactsToCsv(
  contacts: Record<string, unknown>[]
): string {
  if (contacts.length === 0) return ''

  const headers = [
    'Компания',
    'Телефон',
    'Адрес',
    'Город',
    'Категория',
    'Статус',
    'Скор',
    'Чёрный список',
    'Дата добавления',
  ]

  const rows = contacts.map((c) => [
    c.company_name,
    c.phone ?? '',
    c.address ?? '',
    c.city,
    c.category ?? '',
    c.lead_status,
    c.lead_score,
    c.is_blacklisted ? 'Да' : 'Нет',
    c.created_at
      ? new Date(c.created_at as string).toLocaleDateString('ru-RU')
      : '',
  ])

  const escape = (val: unknown) => {
    const str = String(val ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  return [
    headers.join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n')
}
