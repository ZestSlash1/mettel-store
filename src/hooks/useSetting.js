import { useEffect, useState } from 'react'
import { getSetting, subscribe } from '../lib/dataStore'

/** Reads a single admin-editable setting, re-reading whenever the store mutates. */
export function useSetting(key, fallback = '') {
  const [value, setValue] = useState(fallback)

  useEffect(() => {
    let active = true
    const load = () => {
      getSetting(key).then((v) => {
        if (active) setValue(v ?? fallback)
      })
    }
    load()
    const unsub = subscribe(load)
    return () => {
      active = false
      unsub()
    }
  }, [key])

  return value
}
