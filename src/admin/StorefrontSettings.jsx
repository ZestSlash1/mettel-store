import { useEffect, useState } from 'react'
import { getSetting, setSetting } from '../lib/dataStore'
import { Btn } from './ui'

export default function StorefrontSettings() {
  const [heroImage, setHeroImage] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSetting('hero_image').then((v) => {
      if (v) setHeroImage(v)
      setLoading(false)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await setSetting('hero_image', heroImage.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert(`Save failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-tight">Storefront</h2>
        <p className="mt-1 font-mono text-[12px] text-ink/50">Control what appears on the homepage.</p>
      </div>

      <div className="card-soft p-6 space-y-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">Hero product</div>

        {/* Preview */}
        <div className="flex items-center justify-center rounded-3xl bg-silver-100/60 h-52 overflow-hidden">
          {loading ? (
            <div className="h-full w-full animate-pulse bg-silver-200/60 rounded-3xl" />
          ) : heroImage ? (
            <img src={heroImage} alt="Hero preview" className="h-full w-full object-contain p-6" />
          ) : (
            <div className="text-center">
              <div className="font-mono text-[11px] text-ink/30 uppercase tracking-wider">No image set</div>
              <div className="font-mono text-[10px] text-ink/20 mt-1">Paste a URL below to preview</div>
            </div>
          )}
        </div>

        {/* URL input */}
        <div className="space-y-2">
          <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
            Image URL
          </label>
          <input
            type="url"
            value={heroImage}
            onChange={(e) => { setHeroImage(e.target.value); setSaved(false) }}
            placeholder="https://…/your-product.png"
            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 font-mono text-[12px] text-ink outline-none transition-colors placeholder:text-ink/25 focus:border-flame-500"
          />
          <p className="font-mono text-[10px] text-ink/35 leading-relaxed">
            A transparent PNG works best — upload to Supabase Storage → copy the public URL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Btn variant="flame" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Btn>
          {saved && (
            <span className="font-mono text-[11px] text-green-600 uppercase tracking-wider">Saved ✓</span>
          )}
          {heroImage && (
            <Btn variant="ghost" onClick={() => { setHeroImage(''); setSaved(false) }}>
              Clear
            </Btn>
          )}
        </div>
      </div>

      <div className="card-soft p-6 space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">How to upload your product image</div>
        <ol className="space-y-2 font-mono text-[12px] leading-relaxed text-ink/60 list-none">
          {[
            'Go to Supabase → Storage → product-images bucket',
            'Click Upload file and pick your PNG (transparent background recommended)',
            'Click the uploaded file → Copy URL',
            'Paste the URL above and hit Save',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-flame-500 shrink-0">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
