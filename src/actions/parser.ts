'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { parseTwoGis } from '@/lib/twogis/client'

export async function runParser(formData: FormData) {
  const city = formData.get('city') as string
  const query = formData.get('query') as string

  if (!city || !query) {
    return { error: 'Город и запрос обязательны' }
  }

  const supabase = createAdminClient()

  // Create parsing task
  const { data: task, error: taskError } = await supabase
    .from('b2b_parsing_tasks')
    .insert({ city, search_query: query, status: 'running' })
    .select()
    .single()

  if (taskError) {
    return { error: `Ошибка создания задачи: ${taskError.message}` }
  }

  try {
    const result = await parseTwoGis({ city, query })

    let savedCount = 0
    let duplicateCount = 0

    for (const contact of result.contacts) {
      const { error: upsertError } = await supabase
        .from('b2b_contacts')
        .upsert(
          {
            external_id: contact.external_id,
            company_name: contact.company_name,
            phone: contact.phone,
            address: contact.address,
            city: contact.city,
            category: contact.category,
            parsing_task_id: task.id,
          },
          { onConflict: 'external_id', ignoreDuplicates: false }
        )

      if (upsertError) {
        duplicateCount++
      } else {
        savedCount++
      }
    }

    // Update task with results
    await supabase
      .from('b2b_parsing_tasks')
      .update({
        status: 'completed',
        total_found: result.totalFound,
        total_saved: savedCount,
        total_duplicates: duplicateCount,
      })
      .eq('id', task.id)

    return {
      success: true,
      taskId: task.id,
      totalFound: result.totalFound,
      saved: savedCount,
      duplicates: duplicateCount,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка'

    await supabase
      .from('b2b_parsing_tasks')
      .update({ status: 'failed', error_message: message })
      .eq('id', task.id)

    return { error: message }
  }
}

export async function getParsingHistory() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('b2b_parsing_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return { error: error.message }
  return { data }
}
