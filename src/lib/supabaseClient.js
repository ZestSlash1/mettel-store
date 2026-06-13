import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase is optional during front-end development.
 * The client is only created when both env vars are present, so the
 * storefront runs fully on local JSON until you wire up the backend.
 *
 * Expected tables (see README for full schema):
 *   - categories (id, label, slug, active)
 *   - products   (id, sku, category_id, name, tagline, price, currency,
 *                 status, is_featured, color, color_hex, accent_hex,
 *                 specs jsonb, image, models text[], stock, rank)
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
