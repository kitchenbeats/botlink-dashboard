interface Invoice {
  cost: number
  paid: boolean
  url: string
  date_created: string
}

interface BillingLimit {
  limit_amount_gte: number | null
  alert_amount_gte: number | null
}

interface CustomerPortalResponse {
  url: string
}

interface UsageResponse {
  credits: number
  day_usages: {
    date: string
    sandbox_count: number
    cpu_hours: number
    ram_gib_hours: number
    price_for_ram: number
    price_for_cpu: number
  }[]
}

interface CreateTeamsResponse {
  id: string
  slug: string
}

// ORDERS

interface OrderItem {
  name: string
  count: number
}

interface Order {
  id: string
  amount: number
  items: OrderItem[]
}

interface TeamOrdersPostRequest {
  items: OrderItem[]
}

interface TeamOrdersPostResponse {
  client_secret: string
}

export type {
  BillingLimit,
  CreateTeamsResponse,
  CustomerPortalResponse,
  Invoice,
  Order,
  OrderItem,
  TeamOrdersPostRequest,
  TeamOrdersPostResponse,
  UsageResponse,
}
