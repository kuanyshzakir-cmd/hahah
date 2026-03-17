'use client'

import { useState, useEffect } from 'react'
import { getProducts, createProduct, deleteProduct } from '@/actions/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Plus, Trash2 } from 'lucide-react'

interface Product {
  id: string
  name_ru: string
  name_kz: string | null
  sku: string | null
  category: string
  description: string | null
  sizes: string[]
  colors: string[]
  price_retail: number | null
  price_wholesale: number | null
  min_wholesale_qty: number
  image_url: string | null
  in_stock: boolean
}

const CATEGORIES = [
  { value: 'coats', label: 'Халаты' },
  { value: 'suits', label: 'Костюмы' },
  { value: 'caps', label: 'Шапочки' },
  { value: 'shoes', label: 'Обувь' },
  { value: 'accessories', label: 'Аксессуары' },
  { value: 'other', label: 'Другое' },
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
)

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [inStock, setInStock] = useState('true')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const res = await getProducts()
    if (res.data) setProducts(res.data)
  }

  async function handleCreate(formData: FormData) {
    formData.set('category', category)
    formData.set('in_stock', inStock)
    const res = await createProduct(formData)
    if (res.success) {
      setOpen(false)
      setCategory('')
      loadProducts()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить продукт?')) return
    await deleteProduct(id)
    loadProducts()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Продукты</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={<Button />}
          >
            <Plus className="size-4" />
            Добавить
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Новый продукт</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ru">Название (рус)</Label>
                  <Input id="name_ru" name="name_ru" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_kz">Название (каз)</Label>
                  <Input id="name_kz" name="name_kz" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">Артикул (SKU)</Label>
                  <Input id="sku" name="sku" />
                </div>
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sizes">Размеры (через запятую)</Label>
                  <Input id="sizes" name="sizes" placeholder="XS, S, M, L, XL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colors">Цвета (через запятую)</Label>
                  <Input id="colors" name="colors" placeholder="белый, голубой" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_retail">Розница</Label>
                  <Input id="price_retail" name="price_retail" type="number" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_wholesale">Опт</Label>
                  <Input id="price_wholesale" name="price_wholesale" type="number" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_wholesale_qty">Мин. опт</Label>
                  <Input
                    id="min_wholesale_qty"
                    name="min_wholesale_qty"
                    type="number"
                    defaultValue="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">URL фото</Label>
                  <Input id="image_url" name="image_url" type="url" />
                </div>
                <div className="space-y-2">
                  <Label>В наличии</Label>
                  <Select value={inStock} onValueChange={(v) => setInStock(v ?? 'true')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Да</SelectItem>
                      <SelectItem value="false">Нет</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Создать
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Каталог ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Продукты ещё не добавлены.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Артикул</TableHead>
                  <TableHead className="text-right">Розница</TableHead>
                  <TableHead className="text-right">Опт</TableHead>
                  <TableHead>Размеры</TableHead>
                  <TableHead>Наличие</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name_ru}</TableCell>
                    <TableCell>{CATEGORY_LABELS[product.category] ?? product.category}</TableCell>
                    <TableCell className="text-muted-foreground">{product.sku ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {product.price_retail ? `${product.price_retail} ₸` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.price_wholesale ? `${product.price_wholesale} ₸` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.sizes?.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.in_stock ? 'outline' : 'destructive'}>
                        {product.in_stock ? 'Есть' : 'Нет'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="size-3.5" />
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
