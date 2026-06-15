import { useEffect } from 'react'

/**
 * Tiny, dependency-free SEO helper. Sets the document title and updates the
 * description + Open Graph/Twitter tags on mount. Drop <Seo title description />
 * into any page. Keeps share previews and browser tabs accurate in an SPA.
 */
const SITE = 'MetTel'
const DEFAULT_TITLE = 'MetTel — Engineered Everyday Objects'
const DEFAULT_DESC =
  'Designed objects for everyday life — phone coverage, audio, accessories, and lifestyle goods. Built in India, shipped worldwide.'

function setMeta(selector, attr, key, value) {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

export default function Seo({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${SITE}` : DEFAULT_TITLE
    const desc = description || DEFAULT_DESC
    document.title = fullTitle
    setMeta('meta[name="description"]', 'name', 'description', desc)
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc)
  }, [title, description])

  return null
}
