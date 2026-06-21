import { formatPrice } from '../hooks/useProducts'
import { isSoldOut, isLowStock } from '../lib/product'
import { Btn } from './ui'

const STATUS_DOT = {
  available: 'bg-green-500',
  preorder: 'bg-flame-500',
  soldout: 'bg-ink/30',
}

function StockBadge({ product }) {
  if (product.status === 'preorder') {
    return <span className="font-mono text-[10px] text-ink/40">preorder</span>
  }
  const stock = Number(product.stock) || 0
  if (isSoldOut(product)) {
    return <span className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-ink/50">Out</span>
  }
  if (isLowStock(product)) {
    return <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-amber-700">Low · {stock}</span>
  }
  return <span className="font-mono text-[10px] text-ink/50">{stock}</span>
}

export default function ProductsTable({ products, categories, onEdit, onDuplicate, onDelete }) {
  const catLabel = (id) => categories.find((c) => c.id === id)?.label || id

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 p-12 text-center">
        <p className="font-mono text-sm text-ink/50">No products yet.</p>
        <p className="mt-1 font-mono text-[11px] text-ink/35">Hit “New product” to add your first one.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-ink/5">
      <table className="w-full border-collapse bg-white text-left">
        <thead>
          <tr className="border-b border-ink/10 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
            <th className="px-4 py-3 font-normal">Product</th>
            <th className="hidden px-4 py-3 font-normal sm:table-cell">Category</th>
            <th className="hidden px-4 py-3 font-normal md:table-cell">Status</th>
            <th className="hidden px-4 py-3 font-normal sm:table-cell">Stock</th>
            <th className="px-4 py-3 text-right font-normal">Price</th>
            <th className="px-4 py-3 text-right font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-silver-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-6 w-6 shrink-0 rounded-md ring-1 ring-ink/10" style={{ background: p.color_hex || '#ccc' }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-black uppercase">{p.name}</span>
                      {p.is_featured ? <span className="rounded bg-flame-500 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-[#fff]">Feat</span> : null}
                    </div>
                    <div className="font-mono text-[10px] text-ink/40">{p.sku}</div>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 font-mono text-[11px] text-ink/60 sm:table-cell">{catLabel(p.category_id)}</td>
              <td className="hidden px-4 py-3 md:table-cell">
                <span className="inline-flex items-center gap-2 font-mono text-[11px] text-ink/60">
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT[p.status] || 'bg-ink/30'}`} />
                  {p.status}
                </span>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell"><StockBadge product={p} /></td>
              <td className="px-4 py-3 text-right font-pixel text-sm text-flame-600">{formatPrice(p.price, p.currency)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Btn variant="ghost" onClick={() => onEdit(p)}>Edit</Btn>
                  <Btn variant="ghost" onClick={() => onDuplicate(p)}>Copy</Btn>
                  <Btn variant="danger" onClick={() => onDelete(p)}>Del</Btn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
