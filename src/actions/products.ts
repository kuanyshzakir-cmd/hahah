'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getProducts() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('b2b_products')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

export async function createProduct(formData: FormData) {
  const supabase = createAdminClient()

  const sizes = (formData.get('sizes') as string)
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? []
  const colors = (formData.get('colors') as string)
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? []

  const { error } = await supabase.from('b2b_products').insert({
    name_ru: formData.get('name_ru') as string,
    name_kz: (formData.get('name_kz') as string) || null,
    sku: (formData.get('sku') as string) || null,
    category: formData.get('category') as string,
    description: (formData.get('description') as string) || null,
    sizes,
    colors,
    price_retail: parseFloat(formData.get('price_retail') as string) || null,
    price_wholesale: parseFloat(formData.get('price_wholesale') as string) || null,
    min_wholesale_qty: parseInt(formData.get('min_wholesale_qty') as string) || 10,
    image_url: (formData.get('image_url') as string) || null,
    in_stock: formData.get('in_stock') === 'true',
  })

  if (error) return { error: error.message }

  revalidatePath('/products')
  return { success: true }
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createAdminClient()

  const sizes = (formData.get('sizes') as string)
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? []
  const colors = (formData.get('colors') as string)
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? []

  const { error } = await supabase
    .from('b2b_products')
    .update({
      name_ru: formData.get('name_ru') as string,
      name_kz: (formData.get('name_kz') as string) || null,
      sku: (formData.get('sku') as string) || null,
      category: formData.get('category') as string,
      description: (formData.get('description') as string) || null,
      sizes,
      colors,
      price_retail: parseFloat(formData.get('price_retail') as string) || null,
      price_wholesale: parseFloat(formData.get('price_wholesale') as string) || null,
      min_wholesale_qty: parseInt(formData.get('min_wholesale_qty') as string) || 10,
      image_url: (formData.get('image_url') as string) || null,
      in_stock: formData.get('in_stock') === 'true',
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/products')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('b2b_products').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/products')
  return { success: true }
}
