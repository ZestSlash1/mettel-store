import { PolicyPage } from '../components/PageShell'

/* Text-heavy support pages, all built from the shared PolicyPage template. */

export function Shipping() {
  return (
    <PolicyPage
      eyebrow="Support / Shipping"
      seoTitle="Shipping"
      seoDescription="Dispatch times, domestic and international delivery, and tracking for MetTel orders."
      title={<>Shipping</>}
      intro="How and when your order reaches you. Built in India, shipped worldwide."
      sections={[
        {
          h: 'Dispatch',
          body: [
            'In-stock orders are dispatched within 2 business days of payment confirmation. Pre-orders ship with the next production batch — the expected window is shown on the product page.',
            'You’ll receive a tracking link by email the moment your parcel leaves our facility.',
          ],
        },
        {
          h: 'Domestic (India)',
          body: [
            'Standard delivery lands in 3–6 business days depending on your PIN code. Shipping is free on every order — no minimum.',
          ],
        },
        {
          h: 'International',
          body: [
            'We ship worldwide via tracked courier. Transit typically takes 7–14 business days. Duties and import taxes, where applicable, are charged on delivery by your local customs and are the recipient’s responsibility.',
          ],
        },
        {
          h: 'Questions',
          body: [
            'Stuck on a tracking update? Email support@mettel.in with your order ID and we’ll chase it down.',
          ],
        },
      ]}
    />
  )
}

export function Returns() {
  return (
    <PolicyPage
      eyebrow="Support / Returns"
      seoTitle="Returns"
      seoDescription="MetTel's 14-day return window, how to start a return, and refund timelines."
      title={<>Returns</>}
      intro="Bought something you can change your mind about. A 14-day, no-drama return window."
      sections={[
        {
          h: '14-day window',
          body: [
            'If a product isn’t right for you, return it within 14 days of delivery for a full refund. Items must be unused and in their original packaging.',
          ],
        },
        {
          h: 'How to start',
          body: [
            'Email returns@mettel.in with your order ID and the reason. We’ll send a prepaid return label for domestic orders and instructions for international ones.',
          ],
        },
        {
          h: 'Refunds',
          body: [
            'Once we receive and inspect the item, your refund is issued to the original payment method within 5–7 business days. You’ll get an email at every step.',
          ],
        },
        {
          h: 'Damaged or wrong item',
          body: [
            'Arrived damaged or incorrect? That’s on us — email support@mettel.in within 48 hours of delivery with a photo and we’ll ship a replacement at no cost.',
          ],
        },
      ]}
    />
  )
}

export function Warranty() {
  return (
    <PolicyPage
      eyebrow="Support / Warranty"
      seoTitle="Warranty"
      seoDescription="MetTel's 12-month limited warranty: what's covered and how to make a claim."
      title={<>Warranty</>}
      intro="Built to last. Every MetTel product is backed by a 12-month warranty."
      sections={[
        {
          h: 'What’s covered',
          body: [
            'Every MetTel product carries a 12-month limited warranty against manufacturing defects — material failure, finish defects, and component faults under normal use.',
          ],
        },
        {
          h: 'What’s not',
          body: [
            'Normal cosmetic wear and accidental damage are not covered, and for protective products the warranty covers the product itself, not the device or items used with it.',
          ],
        },
        {
          h: 'Making a claim',
          body: [
            'Email warranty@mettel.in with your order ID and a photo of the issue. Approved claims are replaced free of charge, shipping included.',
          ],
        },
      ]}
    />
  )
}
