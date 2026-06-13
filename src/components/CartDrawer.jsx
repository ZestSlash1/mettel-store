import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../hooks/useProducts'
import PhoneCase from './PhoneCase'

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, subtotal, count, clear } = useCart()
  const [placed, setPlaced] = useState(false)

  // Checkout is a stub — drop your Razorpay/Stripe (or a Supabase `orders`
  // insert) in here. For now it just confirms and clears the cart.
  const checkout = () => {
    setPlaced(true)
    setTimeout(() => {
      clear()
      setPlaced(false)
      closeCart()
    }, 1800)
  }

  const currency = items[0]?.currency || 'INR'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeCart} />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full w-full max-w-md flex-col bg-silver-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">Your bag</div>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight">
                  {count} {count === 1 ? 'item' : 'items'}
                </h2>
              </div>
              <button onClick={closeCart} className="text-2xl leading-none text-ink/50 hover:text-ink" aria-label="Close cart">×</button>
            </div>

            {/* Body */}
            {placed ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-flame-500 text-2xl text-white">✓</div>
                <p className="font-display text-xl font-black uppercase">Order placed</p>
                <p className="max-w-xs font-mono text-[11px] text-ink/50">
                  This is a demo confirmation. Wire a payment provider into the checkout handler to take it live.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="font-display text-xl font-black uppercase text-ink/70">Bag is empty</p>
                <p className="font-mono text-[11px] text-ink/40">Add a case to get started.</p>
                <button onClick={closeCart} className="mt-3 rounded-full bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white hover:bg-flame-500">
                  Keep browsing
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <ul className="space-y-4">
                  {items.map((l) => (
                    <li key={l.lineId} className="flex gap-4 border-b border-ink/10 pb-4 last:border-0">
                      <div className="w-14 shrink-0">
                        {l.image ? (
                          <img src={l.image} alt="" className="h-auto w-full" />
                        ) : (
                          <PhoneCase className="h-auto w-full" shell={l.color_hex} accent={l.accent_hex} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-display text-sm font-black uppercase">{l.name}</div>
                            {l.model ? <div className="font-mono text-[10px] text-ink/45">{l.model}</div> : null}
                            <div className="font-mono text-[10px] text-ink/35">{l.sku}</div>
                          </div>
                          <button onClick={() => removeItem(l.lineId)} className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink/40 hover:text-flame-700">
                            Remove
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full bg-white ring-1 ring-ink/10">
                            <Stepper onClick={() => updateQty(l.lineId, l.qty - 1)} label="−" />
                            <span className="w-7 text-center font-mono text-sm">{l.qty}</span>
                            <Stepper onClick={() => updateQty(l.lineId, l.qty + 1)} label="+" />
                          </div>
                          <span className="font-pixel text-sm text-flame-600">{formatPrice(l.price * l.qty, l.currency)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer */}
            {!placed && items.length > 0 ? (
              <div className="border-t border-ink/10 px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/50">Subtotal</span>
                  <span className="font-display text-2xl font-black">{formatPrice(subtotal, currency)}</span>
                </div>
                <p className="mb-4 font-mono text-[10px] text-ink/40">Shipping & taxes calculated at checkout.</p>
                <button onClick={checkout} className="w-full rounded-full bg-flame-500 py-3.5 font-mono text-[12px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-flame-600">
                  Checkout
                </button>
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Stepper({ onClick, label }) {
  return (
    <button onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-base text-ink/70 hover:bg-ink hover:text-white" aria-label={label === '+' ? 'Increase' : 'Decrease'}>
      {label}
    </button>
  )
}
