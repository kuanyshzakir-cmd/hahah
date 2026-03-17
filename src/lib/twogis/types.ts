export interface TwoGisItem {
  id: string
  name: string
  address_name?: string
  full_address_name?: string
  rubrics?: { id: string; name: string }[]
  contact_groups?: {
    contacts: {
      type: string
      value: string
    }[]
  }[]
  reviews?: {
    general_rating?: number
    general_review_count?: number
  }
}

export interface TwoGisResponse {
  meta: {
    code: number
    error?: { message: string }
  }
  result: {
    total: number
    items: TwoGisItem[]
  }
}

export interface ParsedContact {
  external_id: string
  company_name: string
  phone: string | null
  address: string | null
  city: string
  category: string | null
  rating: number | null
  reviews_count: number | null
}
