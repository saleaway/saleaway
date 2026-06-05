'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import ReactMarkdown from 'react-markdown'
import Nav from '../../Nav'
import { useIsMobile } from '../../useIsMobile'
import { mergeTheme, cardShadow, btnStyles, type Theme } from '../../theme'
import { StoreFooter } from '../../StoreFooter'

interface Variant { id: string; label: string; stock: number; price_override: number | null; image_url: string | null; order: number }
interface Product {
  id: string; name: string; description: string; price: number
  sale_price: number | null; sale_badge_type: string | null
  category: string; image_url: string; images: string[]; sold: boolean; stock: number
  has_variants: boolean
}
interface Policy { id: string; title: string; content: string; order: number }

function formatPrice(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function ChevronLeft({ color = '#fff' }: { color?: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
}
function ChevronRight({ color = '#fff' }: { color?: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [showSimilar, setShowSimilar] = useState(true)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [mainImage, setMainImage] = useState(''); const [mainIndex, setMainIndex] = useState(0); const [thumbStart, setThumbStart] = useState(0)
  const [added, setAdded] = useState(false)
  const [settings, setSettings] = useState<any | null>(() => {
    if (typeof window !== 'undefined') { const c = localStorage.getItem('siteSettings'); if (c) try { return JSON.parse(c) } catch {} }
    return null
  })
  const [productLoaded, setProductLoaded] = useState(false)
  const isMobile = useIsMobile()
  const thumbsToShow = 4

  useEffect(() => { fetchProduct(); fetchSettings(); fetchPolicies() }, [])

  async function fetchSettings() {
    const cached = localStorage.getItem('siteSettings')
    if (cached) { try { const p = JSON.parse(cached); setSettings(p); if (p.show_similar_products !== undefined) setShowSimilar(p.show_similar_products !== false) } catch {} }
    const { data } = await supabase.from('settings').select('*').single()
    if (data) { setSettings(data); setShowSimilar(data.show_similar_products !== false); localStorage.setItem('siteSettings', JSON.stringify(data)) }
  }
  async function fetchPolicies() { const { data } = await supabase.from('policies').select('*').order('order', { ascending: true }); setPolicies(data || []) }
  async function fetchProduct() {
    const { id } = await params
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    if (data) {
      setProduct(data)
      const imgs = data.images?.length ? data.images : [data.image_url]; setMainImage(imgs[0])
      fetchSimilar(id, data.category)
      if (data.has_variants) {
        const { data: vars } = await supabase.from('variants').select('*').eq('product_id', id).order('order', { ascending: true })
        setVariants(vars || [])
      }
    }
    setProductLoaded(true)
  }
  async function fetchSimilar(currentId: string, category: string) {
    const { data } = await supabase.from('products').select('*').eq('category', category).neq('id', currentId).limit(4)
    setSimilarProducts(data || [])
  }

  function getAllImages() {
    if (!product) return []
    const base = product.images?.length ? product.images : [product.image_url]
    if (selectedVariant?.image_url) return [selectedVariant.image_url, ...base.filter(i => i !== selectedVariant.image_url)]
    return base
  }
  function goToImage(index: number) {
    const imgs = getAllImages(); const ni = (index + imgs.length) % imgs.length
    setMainIndex(ni); setMainImage(imgs[ni])
    // Keep thumbstrip in view
    if (ni < thumbStart) setThumbStart(ni)
    else if (ni >= thumbStart + thumbsToShow) setThumbStart(ni - thumbsToShow + 1)
  }

  function selectVariant(v: Variant) {
    setSelectedVariant(v)
    if (v.image_url) { setMainImage(v.image_url); setMainIndex(0) }
  }

  function addToCart() {
    if (!product) return
    if (product.has_variants && !selectedVariant) { alert('Please select an option first.'); return }
    const stored = localStorage.getItem('cart'); const cart = stored ? JSON.parse(stored) : []
    const price = selectedVariant?.price_override ?? product.sale_price ?? product.price
    const existing = cart.find((x: any) => selectedVariant ? x.variant_id === selectedVariant.id : x.id === product.id && !x.variant_id)
    const newItem = { id: product.id, name: product.name, price, qty: 1, image_url: selectedVariant?.image_url || product.image_url, category: product.category, stock: selectedVariant ? selectedVariant.stock : product.stock, ...(selectedVariant ? { variant_id: selectedVariant.id, variant_label: selectedVariant.label } : {}) }
    const updated = existing ? cart.map((x: any) => (selectedVariant ? x.variant_id === selectedVariant.id : x.id === product.id && !x.variant_id) ? { ...x, qty: x.qty + 1 } : x) : [...cart, newItem]
    localStorage.setItem('cart', JSON.stringify(updated)); window.dispatchEvent(new Event('storage'))
    setAdded(true); setTimeout(() => setAdded(false), 1000)
  }

  async function buyNow() {
    if (!product) return
    if (product.has_variants && !selectedVariant) { alert('Please select an option first.'); return }
    const price = selectedVariant?.price_override ?? product.sale_price ?? product.price
    const cartItem = { id: product.id, name: product.name, price, qty: 1, image_url: selectedVariant?.image_url || product.image_url, category: product.category, stock: selectedVariant ? selectedVariant.stock : product.stock, ...(selectedVariant ? { variant_id: selectedVariant.id, variant_label: selectedVariant.label } : {}) }
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: [cartItem] }) })
      const data = await res.json(); if (data.url) window.location.href = data.url; else alert('Checkout failed.')
    } catch { alert('Something went wrong.') }
  }

  if (!productLoaded || !settings || !product) return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F5F2EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #eee', borderTop: '3px solid #888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const t = mergeTheme(settings?.theme)
  const accent = settings?.accent_color || '#C0392B'
  const priceColor = t.text_price || accent
  const badgeBg = t.badge_bg || accent
  const shadow = cardShadow(t)
  const allImages = getAllImages()
  const onSale = product.sale_price && product.sale_price < product.price
  const displayPrice = selectedVariant?.price_override ?? (onSale ? product.sale_price! : product.price)
  const isOOS = product.has_variants
    ? selectedVariant ? selectedVariant.stock === 0 : false
    : product.stock === 0 || product.sold

  // Nav arrow button style (on top of main image)
  const mainNavBtn = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute', [side]: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(15,15,15,0.52)', backdropFilter: 'blur(6px)',
    border: '1.5px solid rgba(255,255,255,0.22)',
    borderRadius: 10, width: 44, height: 44, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 16px rgba(0,0,0,0.22)', zIndex: 2, transition: 'background 0.15s',
  })

  // Thumb strip nav button style
  const thumbNavBtn = (disabled: boolean): React.CSSProperties => ({
    background: disabled ? t.bg_card : t.text_primary,
    border: `1.5px solid ${t.border_card_color}`,
    borderRadius: 8, width: 36, height: 36,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, opacity: disabled ? 0.35 : 1, transition: 'all 0.15s',
  })

  return (
    <div style={{ fontFamily: t.font_body, background: t.bg_page, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --accent: ${accent}; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700;900&family=Playfair+Display:wght@400;700&display=swap');
        .main-nav-btn:hover { background: rgba(15,15,15,0.82) !important; }
        .thumb-nav-btn:hover:not(:disabled) { opacity: 0.85 !important; }
      ` }} />
      <Nav />

      <div style={{ maxWidth: t.page_max_width, margin: '0 auto', padding: '32px 24px' }}>
        <p style={{ fontSize: 13, color: t.text_secondary, marginBottom: 24 }}>
          <span onClick={() => window.location.href = '/'} style={{ cursor: 'pointer', color: accent }}>Store</span>{' → '}{product.name}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 40, alignItems: 'start' }}>
          {/* IMAGE GALLERY */}
          <div>
            {/* Main image */}
            <div style={{ position: 'relative', borderRadius: t.radius_card, overflow: 'hidden', background: t.bg_card, boxShadow: shadow, marginBottom: 12 }}>
              <img src={mainImage || 'https://via.placeholder.com/600x500?text=No+Image'} alt={product.name}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />

              {allImages.length > 1 && (
                <>
                  {/* Prev button */}
                  <button className="main-nav-btn" onClick={() => goToImage(mainIndex - 1)} style={mainNavBtn('left')}>
                    <ChevronLeft />
                  </button>
                  {/* Next button */}
                  <button className="main-nav-btn" onClick={() => goToImage(mainIndex + 1)} style={mainNavBtn('right')}>
                    <ChevronRight />
                  </button>
                  {/* Dot strip */}
                  <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
                    {allImages.map((_, i) => (
                      <button key={i} onClick={() => goToImage(i)} style={{ width: i === mainIndex ? 22 : 8, height: 8, borderRadius: 4, background: i === mainIndex ? '#fff' : 'rgba(255,255,255,0.42)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {allImages.length > thumbsToShow && (
                  <button className="thumb-nav-btn" onClick={() => setThumbStart(Math.max(0, thumbStart - 1))}
                    disabled={thumbStart === 0} style={thumbNavBtn(thumbStart === 0)}>
                    <ChevronLeft color={thumbStart === 0 ? t.text_secondary : '#fff'} />
                  </button>
                )}

                <div style={{ display: 'flex', gap: 8, flex: 1, overflow: 'hidden' }}>
                  {allImages.slice(thumbStart, thumbStart + thumbsToShow).map((img, i) => {
                    const ai = thumbStart + i
                    const active = ai === mainIndex
                    return (
                      <div key={ai} onClick={() => goToImage(ai)}
                        style={{ width: `calc(${100 / thumbsToShow}% - 6px)`, aspectRatio: '1', borderRadius: Math.max(t.radius_image, 6), overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: active ? `2.5px solid ${accent}` : `2px solid ${t.border_card_color}`, boxShadow: active ? `0 0 0 2px ${accent}33` : 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}>
                        <img src={img} alt={`View ${ai + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    )
                  })}
                </div>

                {allImages.length > thumbsToShow && (
                  <button className="thumb-nav-btn" onClick={() => setThumbStart(Math.min(allImages.length - thumbsToShow, thumbStart + 1))}
                    disabled={thumbStart >= allImages.length - thumbsToShow}
                    style={thumbNavBtn(thumbStart >= allImages.length - thumbsToShow)}>
                    <ChevronRight color={thumbStart >= allImages.length - thumbsToShow ? t.text_secondary : '#fff'} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div style={{ position: isMobile ? 'static' : 'sticky', top: t.nav_height + 18 }}>
            <p style={{ fontSize: 12, color: t.text_secondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>{product.category}</p>
            <h1 style={{ fontFamily: t.font_heading, fontSize: 28, letterSpacing: -0.5, marginBottom: 12, lineHeight: 1.3, color: t.text_primary, fontWeight: t.font_weight_heading }}>{product.name}</h1>

            <p style={{ fontSize: t.font_size_price + 10, fontWeight: 700, color: priceColor, marginBottom: 20 }}>
              ${formatPrice(displayPrice)}
              {selectedVariant?.price_override && <span style={{ fontSize: 13, color: t.text_secondary, fontWeight: 400, marginLeft: 8 }}>for {selectedVariant.label}</span>}
            </p>

            {/* VARIANT SELECTOR */}
            {product.has_variants && variants.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: t.text_primary, marginBottom: 10 }}>
                  {selectedVariant ? <>Option: <span style={{ color: accent }}>{selectedVariant.label}</span></> : 'Select an option:'}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {variants.map(v => {
                    const selected = selectedVariant?.id === v.id
                    const oos = v.stock === 0
                    return (
                      <button key={v.id} onClick={() => !oos && selectVariant(v)}
                        style={{ padding: '8px 16px', borderRadius: t.radius_btn, border: selected ? `2px solid ${accent}` : `1px solid ${t.border_card_color}`, background: selected ? accent + '12' : t.bg_card, color: oos ? '#bbb' : t.text_primary, fontSize: 13, fontWeight: selected ? 700 : 500, cursor: oos ? 'not-allowed' : 'pointer', opacity: oos ? 0.5 : 1, textDecoration: oos ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                        {v.label}{oos ? ' — Out of Stock' : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {product.description && (
              <div style={{ fontSize: t.font_size_base, color: t.text_primary, lineHeight: 1.8, marginBottom: 28 }}>
                <ReactMarkdown components={{
                  p: ({ children }) => <p style={{ marginBottom: 12, color: t.text_primary }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ fontWeight: 700, color: t.text_primary }}>{children}</strong>,
                  em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                  ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: 4, color: t.text_primary }}>{children}</li>,
                  h2: ({ children }) => <h2 style={{ fontFamily: t.font_heading, fontSize: 17, marginBottom: 8, color: t.text_primary }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: t.text_primary }}>{children}</h3>,
                }}>{product.description}</ReactMarkdown>
              </div>
            )}

            {isOOS
              ? <div style={{ background: '#FEF3CD', color: '#6B4F00', padding: 14, borderRadius: t.radius_btn, fontWeight: 600, textAlign: 'center', fontSize: 15 }}>Out of Stock</div>
              : !product.has_variants || selectedVariant
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={addToCart} style={{ ...btnStyles(t, added ? '#27AE60' : accent), fontSize: 15 }}>{added ? '✓ Added to Cart!' : 'Add to Cart'}</button>
                    <button onClick={buyNow} style={{ width: '100%', background: '#185FA5', color: '#fff', border: 'none', borderRadius: t.radius_btn, padding: '13px', fontWeight: t.font_weight_btn, cursor: 'pointer', fontSize: 15 }}>Buy Now →</button>
                  </div>
                : <div style={{ background: t.bg_page, border: `1px solid ${t.border_card_color}`, borderRadius: t.radius_btn, padding: 14, textAlign: 'center', fontSize: 14, color: t.text_secondary }}>← Select an option above to continue</div>}
          </div>
        </div>

        {/* SIMILAR PRODUCTS */}
        {showSimilar && similarProducts.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <h2 style={{ fontFamily: t.font_heading, fontSize: 22, marginBottom: 20, color: t.text_primary, fontWeight: t.font_weight_heading }}>More from <em style={{ color: accent }}>{product.category}</em></h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: t.grid_gap }}>
              {similarProducts.map(p => {
                const pOnSale = p.sale_price && p.sale_price < p.price
                return (
                  <div key={p.id} onClick={() => window.location.href = `/product/${p.id}`}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = shadow }}
                    style={{ background: t.bg_card, borderRadius: t.radius_card, overflow: 'hidden', boxShadow: shadow, border: t.border_card_width > 0 ? `${t.border_card_width}px solid ${t.border_card_color}` : 'none', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease', position: 'relative' }}>
                    {pOnSale && <div style={{ position: 'absolute', top: 8, left: 8, background: badgeBg, color: t.badge_text, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, zIndex: 1 }}>{Math.round((1 - p.sale_price! / p.price) * 100)}% OFF</div>}
                    <img src={p.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} alt={p.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: `${t.radius_image}px ${t.radius_image}px 0 0` }} />
                    <div style={{ padding: t.card_padding }}>
                      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: t.text_primary, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                      {pOnSale ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 15, fontWeight: 700, color: priceColor }}>${formatPrice(p.sale_price!)}</span><span style={{ fontSize: 12, color: '#aaa', textDecoration: 'line-through' }}>${formatPrice(p.price)}</span></div> : <p style={{ fontSize: 15, fontWeight: 700, color: priceColor }}>${formatPrice(p.price)}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <StoreFooter policies={policies} accent={accent} t={t} />
    </div>
  )
}