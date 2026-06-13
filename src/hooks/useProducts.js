import { useEffect, useState } from 'react'
import { listProducts, listCategories, subscribe, dataSource } from '../lib/dataStore'

/**
 * Read products + categories from the data store and re-render whenever the
 * store changes (e.g. after an admin edit, in this tab or another).
 *
 * @param {Object} [opts]
 * @param {string}  [opts.category]     - filter by category_id
 * @param {boolean} [opts.featuredOnly] - only is_featured products
 */
export function useProducts({ category, featuredOnly } = {}) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        const [prods, cats] = await Promise.all([listProducts({ category }), listCategories()])
        if (!active) return
        setProducts(featuredOnly ? prods.filter((p) => p.is_featured) : prods)
        setCategories(cats)
        setError(null)
      } catch (e) {
        if (active) setError(e)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    const unsub = subscribe(load) // re-run on any store mutation
    return () => {
      active = false
      unsub()
    }
  }, [category, featuredOnly])

  return { products, categories, loading, error, source: dataSource }
}

/** Format an INR/other integer price to a display string. */
export function formatPrice(value, currency = 'INR') {
  if (currency === 'INR') return `₹${Number(value).toLocaleString('en-IN')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}
