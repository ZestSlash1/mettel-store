import { useState } from 'react'
import PageShell from '../components/PageShell'
import { formatPrice } from '../hooks/useProducts'

const DENOMINATIONS = [1000, 2500, 5000, 10000]

export default function GiftCards() {
  const [amount, setAmount] = useState(2500)

  // No gift-card backend yet — route the purchase intent to email so it’s
  // functional today. Swap for a real SKU/checkout when ready.
  const mailto = `mailto:hello@mettel.in?subject=${encodeURIComponent(
    `Gift card — ${formatPrice(amount)}`,
  )}&body=${encodeURIComponent(
    `I'd like to buy a MetTel gift card worth ${formatPrice(amount)}.`,
  )}`

  return (
    <PageShell
      eyebrow="Shop / Gift Cards"
      seoTitle="Gift Cards"
      seoDescription="Digital MetTel gift cards, delivered by email and redeemable on the full lineup."
      title={<>Gift<br />cards</>}
      intro="Give a well-made object. Digital gift cards delivered by email, redeemable on anything in the lineup."
    >
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Visual card */}
        <div className="relative flex aspect-[16/10] flex-col justify-between overflow-hidden rounded-4xl bg-ink p-8 text-silver shadow-soft-lg">
          <div className="pointer-events-none absolute -right-24 -top-10 h-[120%] w-2/3 rounded-full bg-flame-gradient opacity-30 blur-2xl" />
          <div className="relative font-display text-3xl font-black tracking-tight">METTEL</div>
          <div className="relative">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/50">Gift card</div>
            <div className="font-pixel text-4xl text-white">{formatPrice(amount)}</div>
          </div>
        </div>

        {/* Picker */}
        <div className="flex flex-col">
          <div className="eyebrow mb-3">Choose an amount</div>
          <div className="flex flex-wrap gap-2">
            {DENOMINATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setAmount(d)}
                className={`btn px-5 py-2.5 text-[11px] tracking-[0.18em] ${
                  amount === d ? 'btn-flame' : 'btn-soft'
                }`}
              >
                {formatPrice(d)}
              </button>
            ))}
          </div>

          <a
            href={mailto}
            className="btn btn-dark mt-8 w-full py-4 text-[12px] tracking-[0.18em]"
          >
            Buy {formatPrice(amount)} gift card →
          </a>

          <ul className="mt-8 space-y-2 font-mono text-[11px] leading-relaxed text-ink/55">
            <li className="flex gap-2"><span className="text-flame-500">+</span> Delivered by email, usually within an hour</li>
            <li className="flex gap-2"><span className="text-flame-500">+</span> No expiry, redeemable on the full catalogue</li>
            <li className="flex gap-2"><span className="text-flame-500">+</span> Need a custom amount? <span className="text-ink/80">hello@mettel.in</span></li>
          </ul>
        </div>
      </div>
    </PageShell>
  )
}
