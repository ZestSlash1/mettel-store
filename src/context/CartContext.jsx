import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const LS_KEY = 'mettel:cart:v1'

/** A line is unique per product + chosen model. */
const lineId = (productId, model) => `${productId}::${model || 'default'}`

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  const addItem = (product, { model = null, qty = 1 } = {}) => {
    const id = lineId(product.id, model)
    setItems((prev) => {
      const existing = prev.find((l) => l.lineId === id)
      if (existing) {
        return prev.map((l) => (l.lineId === id ? { ...l, qty: l.qty + qty } : l))
      }
      return [
        ...prev,
        {
          lineId: id,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price) || 0,
          currency: product.currency || 'INR',
          color_hex: product.color_hex,
          accent_hex: product.accent_hex,
          image: product.image || null,
          model,
          qty,
        },
      ]
    })
    setIsOpen(true)
  }

  const updateQty = (id, qty) =>
    setItems((prev) =>
      prev
        .map((l) => (l.lineId === id ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0),
    )

  const removeItem = (id) => setItems((prev) => prev.filter((l) => l.lineId !== id))
  const clear = () => setItems([])

  const { count, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, l) => {
        acc.count += l.qty
        acc.subtotal += l.qty * l.price
        return acc
      },
      { count: 0, subtotal: 0 },
    )
  }, [items])

  const value = {
    items,
    addItem,
    updateQty,
    removeItem,
    clear,
    count,
    subtotal,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}
