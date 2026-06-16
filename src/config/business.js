/**
 * Business identity shown on invoices (the "from" / seller block).
 * EDIT THESE with your real registered details. Used by src/components/Invoice.jsx.
 */
export const BUSINESS = {
  name: 'MetTel Inc.',
  // One entry per line on the invoice.
  addressLines: ['Add your registered business address', 'City, State, PIN'],
  email: 'hello@mettel.in',
  phone: '',
  // Leave gstin blank if you're not GST-registered (no tax line is shown anyway).
  gstin: '',
  website: 'mettel.in',
  // WhatsApp number in international format without +/spaces (e.g. '919876543210').
  // Set to '' to hide the floating WhatsApp button.
  whatsapp: '',
}
