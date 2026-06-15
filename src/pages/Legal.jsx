import { PolicyPage } from '../components/PageShell'

/* Legal pages. Reasonable, plain-language defaults — have a lawyer review
   before relying on them for a live storefront. */

const UPDATED = 'Updated June 2026'

export function Privacy() {
  return (
    <PolicyPage
      eyebrow="Legal / Privacy"
      seoTitle="Privacy Policy"
      seoDescription="How MetTel collects, uses, and protects your personal data."
      title={<>Privacy<br />policy</>}
      intro={`${UPDATED}. How we collect, use, and protect your information.`}
      sections={[
        {
          h: 'What we collect',
          body: [
            'When you place an order we collect your name, email, phone number, and shipping address so we can fulfil and deliver it. Payment is processed by Razorpay — we never see or store your full card details.',
            'We also collect basic, non-identifying analytics about how the site is used so we can improve it.',
          ],
        },
        {
          h: 'How we use it',
          body: [
            'Your details are used to process orders, provide support, send order updates, and — only if you opt in — occasional product news. We do not sell your data to anyone.',
          ],
        },
        {
          h: 'Who we share it with',
          body: [
            'We share the minimum necessary with the services that run the store: our payment processor (Razorpay), our database/hosting (Supabase, Vercel), and our shipping couriers. Each handles your data under its own privacy terms.',
          ],
        },
        {
          h: 'Your rights',
          body: [
            'You can ask us to access, correct, or delete the personal data we hold about you at any time. Email privacy@mettel.in and we’ll action it.',
          ],
        },
        {
          h: 'Contact',
          body: ['Questions about privacy? Email privacy@mettel.in.'],
        },
      ]}
    />
  )
}

export function Terms() {
  return (
    <PolicyPage
      eyebrow="Legal / Terms"
      seoTitle="Terms of Service"
      seoDescription="The terms governing your use of MetTel and purchases from the store."
      title={<>Terms of<br />service</>}
      intro={`${UPDATED}. The terms that govern your use of MetTel and any purchase you make.`}
      sections={[
        {
          h: 'Orders & pricing',
          body: [
            'All prices are listed in INR and include applicable taxes unless stated otherwise. We may correct pricing errors and decline or cancel an order at our discretion, refunding any payment in full.',
          ],
        },
        {
          h: 'Payment',
          body: [
            'Payments are processed securely by Razorpay. By completing checkout you authorise the charge for the order total shown, computed from our catalogue prices at the time of purchase.',
          ],
        },
        {
          h: 'Shipping, returns & warranty',
          body: [
            'Delivery, returns, and warranty are governed by our Shipping, Returns, and Warranty pages, which form part of these terms.',
          ],
        },
        {
          h: 'Acceptable use',
          body: [
            'You agree not to misuse the site — no attempting to disrupt it, access it through unauthorised means, or use it for unlawful purposes.',
          ],
        },
        {
          h: 'Liability',
          body: [
            'MetTel’s liability for any order is limited to the amount you paid for it. Our products protect your device but we are not liable for damage to the device itself.',
          ],
        },
        {
          h: 'Contact',
          body: ['Questions about these terms? Email hello@mettel.in.'],
        },
      ]}
    />
  )
}
