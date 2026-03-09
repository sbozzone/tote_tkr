export type Tote = {
  id: string
  name: string
  location: string
  dateUpdated: string
}

export type Item = {
  id: string
  toteId: string
  name: string
  quantity: number
  notes: string
}

export type AppState = {
  totes: Tote[]
  items: Item[]
}

export type ToteInput = Pick<Tote, 'name' | 'location'>

export type ItemInput = Pick<Item, 'name' | 'quantity' | 'notes'>
