'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from './supabase'
import { useIsMobile } from './useIsMobile'
import { mergeTheme, cardShadow, cardHoverStyles, btnStyles, gridColumns, cardImageRatio, headingEffectStyles, heroBgStyle, heroTextColor, scrollEffectCSS, type Theme } from './theme'
import { StoreFooter } from './StoreFooter'

interface Variant { id: string; label: string; stock: number; price_override: number | null; image_url: string | null; order: number }
interface Product {
  id: string; name: string; description: string; price: number
  sale_price: number | null; sale_badge_type: string | null
  category: string; image_url: string; sold: boolean; stock: number
  has_variants: boolean; variants?: Variant[]; sort_order: number; created_at: string
}
interface CartItem {
  id: string; name: string; price: number; qty: number; image_url: string
  category: string; stock: number; variant_id?: string; variant_label?: string
}
interface SortOption { value: string; label: string; enabled: boolean }
interface Policy { id: string; title: string; content: string; order: number }

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Featured', enabled: true },
  { value: 'newest', label: 'Most Recent', enabled: true },
  { value: 'oldest', label: 'Oldest First', enabled: true },
  { value: 'price_asc', label: 'Price: Low to High', enabled: true },
  { value: 'price_desc', label: 'Price: High to Low', enabled: true },
  { value: 'name_az', label: 'Name: A–Z', enabled: true },
  { value: 'name_za', label: 'Name: Z–A', enabled: false },
]
const PAGE_SIZE = 60
const ALL_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Lora:wght@400;700&family=Merriweather:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Yeseva+One&family=Rozha+One&family=DM+Sans:wght@400;700&family=Inter:wght@400;700&family=Montserrat:wght@400;700&family=Raleway:wght@400;700&family=Poppins:wght@400;700&family=Josefin+Sans:wght@400;700&family=Nunito:wght@400;700&family=Oswald:wght@400;700&family=Bebas+Neue&family=Righteous&family=Secular+One&family=Abril+Fatface&family=Pacifico&family=Lobster&family=Satisfy&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Cinzel:wght@400;700&family=Fredoka+One&family=Lato:wght@400;700&family=Source+Sans+3:wght@400;700&family=Open+Sans:wght@400;700&family=Karla:wght@400;700&family=Manrope:wght@400;700&family=Mulish:wght@400;700&family=Quicksand:wght@400;700&display=swap'

function formatPrice(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function getSaleBadgeText(price: number, salePrice: number, badgeType: string | null) {
  const type = badgeType || 'percent_off'
  if (type === 'percent_off') return `${Math.round((1 - salePrice / price) * 100)}% OFF`
  if (type === 'dollars_off') return `$${formatPrice(price - salePrice)} OFF`
  if (type === 'save_dollars') return `SAVE $${formatPrice(price - salePrice)}`
  return `${Math.round((1 - salePrice / price) * 100)}% OFF`
}
function applySort(items: Product[], sortValue: string): Product[] {
  const sorted = [...items]
  if (sortValue === 'featured') return sorted.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  if (sortValue === 'newest') return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  if (sortValue === 'oldest') return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  if (sortValue === 'price_asc') return sorted.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price))
  if (sortValue === 'price_desc') return sorted.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price))
  if (sortValue === 'name_az') return sorted.sort((a, b) => a.name.localeCompare(b.name))
  if (sortValue === 'name_za') return sorted.sort((a, b) => b.name.localeCompare(a.name))
  return sorted
}

// ── Image Carousel Banner ─────────────────────────────────────────────────
function BannerCarousel({ images, interval, accent, radius, ratio }: { images: { url: string; link: string }[]; interval: number; accent: string; radius: number; ratio: string }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const next = useCallback(() => setCurrent(c => (c + 1) % images.length), [images.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + images.length) % images.length), [images.length])

  useEffect(() => {
    if (paused || images.length <= 1) return
    timerRef.current = setInterval(next, interval * 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, images.length, interval, next])

  if (!images.length) return null

  const currentItem = images[current]

  const inner = (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: 'relative', borderRadius: radius, overflow: 'hidden', aspectRatio: ratio, background: '#111', userSelect: 'none', cursor: currentItem.link ? 'pointer' : 'default' }}>
      {images.map((item, i) => (
        <img key={i} src={item.url} alt={`Banner ${i + 1}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === current ? 1 : 0, transition: 'opacity 0.7s ease' }} />
      ))}
      {images.length > 1 && (
        <>
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); prev() }} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, backdropFilter: 'blur(4px)' }}>‹</button>
          <button onClick={e => { e.preventDefault(); e.stopPropagation(); next() }} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, backdropFilter: 'blur(4px)' }}>›</button>
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 2 }}>
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.preventDefault(); e.stopPropagation(); setCurrent(i) }}
                style={{ width: i === current ? 22 : 8, height: 8, borderRadius: 4, background: i === current ? '#fff' : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            ))}
          </div>
        </>
      )}
    </div>
  )

  return currentItem.link
    ? <a href={currentItem.link} target={currentItem.link.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>{inner}</a>
    : inner
}

function VideoOverlay({ videoUrl, thumbnailUrl }: { videoUrl: string; thumbnailUrl: string }) {
  return <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}><video src={videoUrl} controls playsInline poster={thumbnailUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} /></div>
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('All'); const [sort, setSort] = useState('featured'); const [page, setPage] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([]); const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([]); const [announcement, setAnnouncement] = useState<{ message: string; active: boolean } | null>(null)
  const [sortOptions, setSortOptions] = useState<SortOption[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_SORT_OPTIONS
    try {
      const c = localStorage.getItem('siteSettings')
      if (c) { const p = JSON.parse(c); if (p.sort_options) { const saved = p.sort_options; const hasFeatured = saved.some((o: SortOption) => o.value === 'featured'); return hasFeatured ? saved : [{ value: 'featured', label: 'Featured', enabled: true }, ...saved] } }
    } catch {}
    return DEFAULT_SORT_OPTIONS
  }); const [policies, setPolicies] = useState<Policy[]>([])
  const [settings, setSettings] = useState<any | null>(() => {
    if (typeof window === 'undefined') return null
    try { const c = localStorage.getItem('siteSettings'); return c ? JSON.parse(c) : null } catch { return null }
  }); const [bounce, setBounce] = useState(false)
  const isMobile = useIsMobile(); const [addedId, setAddedId] = useState<string | null>(null)
  const [hamburgerOpen, setHamburgerOpen] = useState(false)

  useEffect(() => {
    fetchProducts(); fetchCategories(); fetchAnnouncement(); fetchSettings(); fetchPolicies()
    async function fetchAnnouncement() { const { data } = await supabase.from('announcement').select('*').single(); setAnnouncement(data) }
    async function fetchSettings() {
      const cached = localStorage.getItem('siteSettings')
      if (cached) { const p = JSON.parse(cached); setSettings(p); if (p.sort_options) { const saved = p.sort_options; const hasFeatured = saved.some((o: SortOption) => o.value === 'featured'); const opts = hasFeatured ? saved : [{ value: 'featured', label: 'Featured', enabled: true }, ...saved]; setSortOptions(opts); setSort('featured') } else setSort('featured') }
      const { data } = await supabase.from('settings').select('*').single()
      if (data) { setSettings(data); localStorage.setItem('siteSettings', JSON.stringify(data)); if (data.sort_options) { const saved = data.sort_options; const hasFeatured = saved.some((o: SortOption) => o.value === 'featured'); const opts = hasFeatured ? saved : [{ value: 'featured', label: 'Featured', enabled: true }, ...saved]; setSortOptions(opts); setSort('featured') } else setSort('featured') }
    }
    const stored = localStorage.getItem('cart'); if (stored) setCart(JSON.parse(stored))
    const hv = () => { const s = localStorage.getItem('cart'); if (s) setCart(JSON.parse(s)); else setCart([]) }
    window.addEventListener('focus', hv); document.addEventListener('visibilitychange', hv)
    return () => { window.removeEventListener('focus', hv); document.removeEventListener('visibilitychange', hv) }
  }, [])

  async function fetchPolicies() { const { data } = await supabase.from('policies').select('*').order('order', { ascending: true }); setPolicies(data || []) }
  async function fetchProducts() {
    const { data: prods } = await supabase.from('products').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    if (!prods) { setLoading(false); return }
    const variantProductIds = prods.filter(p => p.has_variants).map(p => p.id)
    let variantMap: Record<string, Variant[]> = {}
    if (variantProductIds.length > 0) {
      const { data: vars } = await supabase.from('variants').select('*').in('product_id', variantProductIds).order('order', { ascending: true })
      if (vars) { vars.forEach(v => { if (!variantMap[v.product_id]) variantMap[v.product_id] = []; variantMap[v.product_id].push(v) }) }
    }
    setProducts(prods.map(p => ({ ...p, variants: variantMap[p.id] || [] })))
    setLoading(false)
  }
  async function fetchCategories() { const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true }); setCategories(data?.map((c: any) => c.name) || []) }

  const t = mergeTheme(settings?.theme)
  const accent = settings?.accent_color || '#C0392B'
  const scrollEffect = (settings?.scroll_effect || 'none') as Theme['scroll_effect']
  const scrollBehavior = (settings?.scroll_behavior || 'once') as 'once' | 'filter' | 'always'
  const scrollEnabled = scrollEffect !== 'none'

  function makeObserver(behavior: 'once' | 'filter' | 'always') {
    return new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.remove('reset')
          // Small delay so reset class is applied first before transition kicks in
          requestAnimationFrame(() => e.target.classList.add('visible'))
          if (behavior === 'once') (e.target as any)._obs?.unobserve(e.target)
        } else if (behavior === 'always') {
          // Instantly snap to hidden (no transition) so you never see it disappear
          e.target.classList.remove('visible')
          e.target.classList.add('reset')
        }
      })
    }, { threshold: 0, rootMargin: '0px 0px 0px 0px' })
  }

  useEffect(() => {
    if (!scrollEnabled || loading) return
    const els = document.querySelectorAll('.scroll-reveal')
    const obs = makeObserver(scrollBehavior)
    els.forEach(el => { (el as any)._obs = obs; obs.observe(el) })
    return () => obs.disconnect()
  }, [scrollEnabled, scrollBehavior, loading])

  useEffect(() => {
    if (!scrollEnabled || scrollBehavior === 'once') return
    setTimeout(() => {
      const els = document.querySelectorAll('.scroll-reveal')
      els.forEach(el => { el.classList.remove('visible'); el.classList.remove('reset') })
      const obs = makeObserver(scrollBehavior)
      els.forEach(el => { (el as any)._obs = obs; obs.observe(el) })
      return () => obs.disconnect()
    }, 50)
  }, [page, filter, sort, search, scrollEnabled, scrollBehavior])

  const priceColor = t.text_price || accent
  const badgeBg = t.badge_bg || accent
  const cardAlign = t.card_text_align || 'left'
  const heroAlign = isMobile ? 'center' : (t.hero_text_align || 'left')
  const hEffect = headingEffectStyles(t.heading_effect || 'none')
  const imgRatio = cardImageRatio(t)
  const catStyle = t.category_style || 'pills'
  const announcementBg = t.announcement_bg || '#1A1714'
  const announcementText = t.announcement_text || '#F5F2EE'
  const logoH = t.nav_logo_height || 36
  const searchTextColor = t.text_search || t.text_primary
  const navButtons = [
    ...(settings?.show_contact_nav !== false && settings?.show_contact_feature !== false ? [{ label: settings?.nav_contact_label || 'Contact', path: '/contact' }] : []),
    ...(settings?.show_nav_policy ? [{ label: settings?.nav_policy_label || 'Policies', path: '/policies' }] : []),
    ...(settings?.custom_page_enabled ? [{ label: settings?.custom_page_label || 'More Info', path: '/custom' }] : []),
  ]
  const rawBannerImages: any[] = settings?.banner_images || []
  const bannerImages = rawBannerImages.map((item: any) => typeof item === 'string' ? { url: item, link: '' } : item)
  const bannerActive: boolean = settings?.banner_active || false
  const bannerInterval: number = settings?.banner_interval || 3
  const bannerRatio: string = settings?.banner_ratio || '16/5'
  const bannerPosition: string = settings?.banner_position || 'below_hero'

  const enabledSortOptions = sortOptions.filter(o => o.enabled)
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || p.category === filter
    return matchSearch && matchFilter
  })
  const sorted = applySort(filtered, sort)
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const displayed = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => { setPage(1) }, [search, filter, sort])

  function addToCart(product: Product, variant?: Variant) {
    const price = variant?.price_override ?? product.sale_price ?? product.price
    const stock = variant ? variant.stock : product.stock
    setCart(prev => {
      const ex = prev.find(x => (variant ? x.variant_id === variant.id : x.id === product.id && !x.variant_id))
      if (ex && ex.qty >= stock) return prev
      const newItem: CartItem = { id: product.id, name: product.name, price, qty: 1, image_url: variant?.image_url || product.image_url, category: product.category, stock, ...(variant ? { variant_id: variant.id, variant_label: variant.label } : {}) }
      const updated = ex ? prev.map(x => (variant ? x.variant_id === variant.id : x.id === product.id && !x.variant_id) ? { ...x, qty: x.qty + 1 } : x) : [...prev, newItem]
      localStorage.setItem('cart', JSON.stringify(updated)); return updated
    })
    setBounce(true); setTimeout(() => setBounce(false), 600)
    setAddedId(variant ? `${product.id}-${variant.id}` : product.id); setTimeout(() => setAddedId(null), 1000)
  }

  const cartCount = cart.reduce((a, b) => a + b.qty, 0)
  async function checkout() { const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart }) }); const { url } = await res.json(); window.location.href = url }

  if (!settings) return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F5F2EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #eee', borderTop: '3px solid #888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const shadow = cardShadow(t)
  const hover = cardHoverStyles(t, accent)
  const heroBg = heroBgStyle(t, accent)
  const heroTxtColor = heroTextColor(t)
  const overlayOpacity = (t.hero_bg_overlay ?? 40) / 100

  function CategoryFilter() {
    const allCats = ['All', ...categories]
    if (catStyle === 'hidden') return null
    if (catStyle === 'dropdown') return (
      <select value={filter} onChange={e => setFilter(e.target.value)}
        style={{ padding: '8px 14px', borderRadius: t.radius_btn, border: `1px solid ${t.border_card_color}`, fontSize: 13, fontWeight: 500, background: t.bg_card, color: t.text_primary, cursor: 'pointer', outline: 'none' }}>
        {allCats.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    )
    if (catStyle === 'underline') return (
      <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', borderBottom: `2px solid ${t.border_card_color}` }}>
        {allCats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{ padding: '8px 18px', background: 'none', border: 'none', borderBottom: filter === c ? `3px solid ${accent}` : '3px solid transparent', marginBottom: -2, cursor: 'pointer', fontSize: 13, fontWeight: filter === c ? 700 : 500, color: filter === c ? accent : t.text_secondary, transition: 'all 0.15s' }}>
            {c}
          </button>
        ))}
      </div>
    )
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {allCats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{ padding: '6px 16px', borderRadius: t.radius_btn, border: `1px solid ${t.border_card_color}`, cursor: 'pointer', fontSize: 13, fontWeight: 500, background: filter === c ? accent : t.bg_card, color: filter === c ? '#fff' : t.text_secondary }}>
            {c}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: t.font_body, background: t.bg_page, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --accent: ${accent}; }
        @import url('${ALL_FONTS_URL}');
        ${scrollEffectCSS(scrollEffect)}
      ` }} />

      {announcement?.active && (
        <div style={{ background: announcementBg, color: announcementText, textAlign: 'center', padding: '10px 16px', fontSize: 13, fontWeight: 500 }}>
          {announcement.message}
        </div>
      )}

      <nav style={{ position: t.nav_sticky ? 'sticky' : 'relative', top: 0, zIndex: 100, background: t.bg_nav, backdropFilter: t.bg_nav.includes('rgba') ? 'blur(12px)' : 'none', borderBottom: `1px solid ${t.border_nav_color}`, padding: '0 16px', height: t.nav_height, display: 'flex', alignItems: 'center', gap: 8 }}>
        <style>{`
          @media (max-width: 640px) { .hp-nav-links { display: none !important; } .hp-hamburger { display: flex !important; } }
          @media (min-width: 641px) { .hp-hamburger { display: none !important; } .hp-nav-links { display: flex !important; } }
          .hp-nav-btn { background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 500; padding: 6px 10px; border-radius: 6px; opacity: 0.75; transition: opacity 0.15s, background 0.15s; }
          .hp-nav-btn:hover { opacity: 1; background: rgba(128,128,128,0.1); }
          .cart-short { display: none; }
          .cart-full { display: inline; }
          @media (max-width: 640px) { .cart-short { display: inline; } .cart-full { display: none; } }
          .hp-hamburger-menu { position: absolute; top: 100%; right: 0; min-width: 160px; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 200; border: 1px solid ${t.border_nav_color}; background: ${t.bg_nav}; }
          .hp-hamburger-item { width: 100%; text-align: left; border: none; cursor: pointer; padding: 12px 18px; font-size: 14px; font-weight: 500; background: transparent; color: ${t.text_nav}; font-family: ${t.font_body}; transition: filter 0.1s; }
          .hp-hamburger-item:hover { filter: brightness(0.9); }
        `}</style>
        <div onClick={() => window.location.href = '/'} style={{ fontFamily: t.font_heading, fontSize: 20, fontWeight: t.font_weight_heading, flex: 1, color: t.text_nav, cursor: 'pointer' }}>
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="logo" style={{ height: logoH, objectFit: 'contain' }} />
            : <span style={hEffect}>{settings?.store_name || 'Sale Away'}</span>}
        </div>

        {/* Desktop nav links */}
        {navButtons.length > 0 && (
          <div className="hp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navButtons.map(btn => (
              <button key={btn.path} onClick={() => window.location.href = btn.path}
                className="hp-nav-btn" style={{ color: t.text_nav, fontFamily: t.font_body }}>{btn.label}</button>
            ))}
          </div>
        )}

        {/* Mobile hamburger */}
        {navButtons.length > 0 && (
          <div className="hp-hamburger" style={{ position: 'relative', display: 'none', alignItems: 'center' }}>
            <button onClick={() => setHamburgerOpen(o => !o)}
              style={{ background: 'none', border: `1px solid ${t.border_nav_color}`, borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 0 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ display: 'block', width: 16, height: 2, background: t.text_nav, borderRadius: 2, transition: 'all 0.2s',
                  ...(hamburgerOpen && i === 0 ? { transform: 'rotate(45deg) translate(4px, 4px)' } : {}),
                  ...(hamburgerOpen && i === 1 ? { opacity: 0 } : {}),
                  ...(hamburgerOpen && i === 2 ? { transform: 'rotate(-45deg) translate(4px, -4px)' } : {}),
                }} />
              ))}
            </button>
            {hamburgerOpen && (
              <div className="hp-hamburger-menu">
                {navButtons.map(btn => (
                  <button key={btn.path} className="hp-hamburger-item"
                    onClick={() => { window.location.href = btn.path; setHamburgerOpen(false) }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setSort('featured') }}
          placeholder="Search..." style={{ padding: '8px 16px', borderRadius: t.radius_btn, border: `1px solid ${t.border_card_color}`, fontSize: t.font_size_base, width: isMobile ? 80 : 200, background: t.bg_page, color: searchTextColor }} />
        <button onClick={() => window.location.href = '/cart'} style={{ background: accent, color: '#fff', border: 'none', borderRadius: t.radius_btn, padding: '8px 16px', fontWeight: t.font_weight_btn, cursor: 'pointer', fontSize: 13, transform: bounce ? 'scale(1.3)' : 'scale(1)', transition: 'all 0.2s ease', boxShadow: `0 4px 12px ${accent}4D`, flexShrink: 0 }}>
          <span className="cart-full">🛒 Cart ({cartCount})</span>
          <span className="cart-short">🛒 {cartCount}</span>
        </button>
      </nav>

      <div style={{ maxWidth: t.page_max_width, margin: '0 auto', padding: '32px 24px' }}>
        {/* Banner — Above Hero */}
        {bannerActive && bannerImages.length > 0 && bannerPosition === 'above_hero' && (
          <div style={{ marginBottom: t.section_gap }}>
            <BannerCarousel images={bannerImages} interval={bannerInterval} accent={accent} radius={t.radius_card} ratio={bannerRatio} />
          </div>
        )}

        {settings?.hero_visible !== false && (
          <div style={{ ...heroBg, borderRadius: t.radius_card, overflow: 'hidden', marginBottom: t.section_gap, boxShadow: `0 4px 24px ${accent}22`, border: t.border_card_width > 0 ? `${t.border_card_width}px solid ${t.border_card_color}` : 'none', position: 'relative' }}>
            {t.hero_style === 'image' && t.hero_bg_image_url && (
              <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity})`, borderRadius: t.radius_card, zIndex: 1 }} />
            )}
            <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '24px 20px' : `${t.hero_padding}px 44px`, display: 'flex', alignItems: 'center', justifyContent: heroAlign === 'center' ? 'center' : 'space-between' }}>
              <div style={{ textAlign: heroAlign, maxWidth: heroAlign === 'center' ? 600 : undefined }}>
                {t.hero_show_badge && <div style={{ background: (t.hero_style === 'solid' || t.hero_style === 'dark' || t.hero_style === 'image') ? 'rgba(255,255,255,0.2)' : '#FDECEA', color: (t.hero_style === 'solid' || t.hero_style === 'dark' || t.hero_style === 'image') ? '#fff' : accent, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 12 }}>⭐ Trusted Seller</div>}
                <h1 style={{ fontFamily: t.font_heading, fontSize: isMobile ? 26 : 32, marginBottom: 8, letterSpacing: -0.5, color: heroTxtColor, fontWeight: t.font_weight_heading, ...hEffect }}>{settings?.hero_headline || 'Unique Finds, Shipped Fast.'}</h1>
                <p style={{ fontSize: t.font_size_base, color: (t.hero_style === 'solid' || t.hero_style === 'dark' || t.hero_style === 'image') ? 'rgba(255,255,255,0.85)' : t.text_secondary, lineHeight: 1.7 }}>{settings?.hero_subtext || ''}</p>
              </div>
              {!isMobile && heroAlign !== 'center' && (settings?.hero_image_url ? <img src={settings.hero_image_url} alt="Hero" style={{ height: 120, objectFit: 'contain', position: 'relative', zIndex: 2 }} /> : <div style={{ fontSize: 72 }}>{settings?.hero_emoji || '🎴'}</div>)}
            </div>
          </div>
        )}

        {/* Banner — Below Hero */}
        {bannerActive && bannerImages.length > 0 && bannerPosition === 'below_hero' && (
          <div style={{ marginBottom: t.section_gap }}>
            <BannerCarousel images={bannerImages} interval={bannerInterval} accent={accent} radius={t.radius_card} ratio={bannerRatio} />
          </div>
        )}

        {settings?.media_active && settings?.media_position === 'below_hero' && (
          <div style={{ marginBottom: t.section_gap, borderRadius: t.radius_card, overflow: 'hidden', boxShadow: shadow }}>
            {settings.media_type === 'image' && <img src={settings.media_url} alt="Store media" style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }} />}
            {settings.media_type === 'video_upload' && (settings.media_overlay && settings.media_thumbnail_url ? <VideoOverlay videoUrl={settings.media_url} thumbnailUrl={settings.media_thumbnail_url} /> : <video src={settings.media_url} controls autoPlay={settings.media_autoplay} muted={settings.media_autoplay} playsInline style={{ width: '100%', maxHeight: 400 }} />)}
            {settings.media_type === 'video_youtube' && <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}><iframe src={(settings.media_url || '').replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen /></div>}
          </div>
        )}

        {/* Banner — Above Products */}
        {bannerActive && bannerImages.length > 0 && bannerPosition === 'above_products' && (
          <div style={{ marginBottom: t.section_gap }}>
            <BannerCarousel images={bannerImages} interval={bannerInterval} accent={accent} radius={t.radius_card} ratio={bannerRatio} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: catStyle === 'underline' ? 'flex-end' : 'center', marginBottom: t.section_gap, flexWrap: 'wrap', gap: 10 }}>
          <CategoryFilter />
          {enabledSortOptions.length > 1 && (
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '7px 12px', borderRadius: t.radius_btn, border: `1px solid ${t.border_card_color}`, fontSize: 13, fontWeight: 500, background: t.bg_card, color: t.text_primary, cursor: 'pointer', outline: 'none' }}>
              {enabledSortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
        </div>

        {loading ? <p style={{ color: t.text_secondary, fontSize: 14 }}>Loading products...</p> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: gridColumns(t, isMobile), gap: t.grid_gap }}>
              {displayed.map((p: Product) => {
                const onSale = p.sale_price && p.sale_price < p.price
                const badge = onSale ? getSaleBadgeText(p.price, p.sale_price!, p.sale_badge_type) : ''
                const isOOS = !p.has_variants && (p.sold || p.stock === 0)
                const variants = p.variants || []
                const variantCount = variants.length
                return (
                  <div key={p.id}
                    className="scroll-reveal"
                    onClick={() => window.location.href = `/product/${p.id}`}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; Object.assign(el.style, hover.enter); const img = el.querySelector('img'); if (img && t.card_hover !== 'none') (img as HTMLImageElement).style.transform = 'scale(1.05)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; Object.assign(el.style, hover.leave); const img = el.querySelector('img'); if (img) (img as HTMLImageElement).style.transform = 'scale(1)' }}
                    style={{ background: t.bg_card, borderRadius: t.radius_card, overflow: 'hidden', boxShadow: shadow, border: t.border_card_width > 0 ? `${t.border_card_width}px solid ${t.border_card_color}` : 'none', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease', position: 'relative' }}>
                    {onSale && <div style={{ position: 'absolute', top: 10, left: 10, background: badgeBg, color: t.badge_text, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: t.radius_btn > 8 ? 6 : t.radius_btn, zIndex: 1 }}>{badge}</div>}
                    <img src={p.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} alt={p.name}
                      style={{ width: '100%', aspectRatio: imgRatio, objectFit: 'cover', transition: 'transform 0.3s ease', borderRadius: `${t.radius_image}px ${t.radius_image}px 0 0` }} />
                    <div style={{ padding: t.card_padding, display: 'flex', flexDirection: 'column', flex: 1, textAlign: cardAlign }}>
                      <p style={{ fontSize: 11, color: t.text_secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{p.category}</p>
                      <p style={{ fontSize: t.font_size_base, fontWeight: 600, marginBottom: 6, lineHeight: 1.4, color: t.text_primary, flex: 1 }}>{p.name}</p>
                      {p.has_variants && variantCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap', justifyContent: cardAlign === 'center' ? 'center' : 'flex-start' }}>
                          {variants.slice(0, 6).map(v => (
                            <div key={v.id} title={v.label} style={{ width: 14, height: 14, borderRadius: '50%', background: accent, opacity: 0.7, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                          ))}
                          <span style={{ fontSize: 11, color: t.text_secondary, marginLeft: 2 }}>{variantCount} option{variantCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {onSale ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, justifyContent: cardAlign === 'center' ? 'center' : 'flex-start' }}>
                          <span style={{ fontSize: t.font_size_price, fontWeight: 700, color: priceColor }}>${formatPrice(p.sale_price!)}</span>
                          <span style={{ fontSize: 13, color: '#aaa', textDecoration: 'line-through' }}>${formatPrice(p.price)}</span>
                        </div>
                      ) : <p style={{ fontSize: t.font_size_price, fontWeight: 700, color: priceColor, marginBottom: 12 }}>${formatPrice(p.price)}</p>}
                      {isOOS
                        ? <span style={{ background: '#FEF3CD', color: '#6B4F00', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: t.radius_btn > 8 ? 6 : t.radius_btn }}>Out of Stock</span>
                        : p.has_variants
                          ? <button onClick={e => { e.stopPropagation(); window.location.href = `/product/${p.id}` }} style={{ ...btnStyles(t, accent) }}>Choose Options</button>
                          : <button onClick={e => { e.stopPropagation(); addToCart(p) }} style={{ ...btnStyles(t, addedId === p.id ? '#27AE60' : accent), boxShadow: addedId === p.id ? '0 4px 12px rgba(39,174,96,0.4)' : `0 4px 12px ${accent}4D` }}>
                              {addedId === p.id ? '✓ Added!' : 'Add to Cart'}
                            </button>}
                    </div>
                  </div>
                )
              })}
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} disabled={page === 1} style={{ padding: '8px 18px', borderRadius: t.radius_btn, border: `1px solid ${t.border_card_color}`, background: t.bg_card, fontSize: 13, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, color: t.text_primary }}>← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ width: 36, height: 36, borderRadius: t.radius_btn > 18 ? '50%' : t.radius_btn, border: `1px solid ${t.border_card_color}`, background: n === page ? accent : t.bg_card, color: n === page ? '#fff' : t.text_secondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{n}</button>
                ))}
                <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} disabled={page === totalPages} style={{ padding: '8px 18px', borderRadius: t.radius_btn, border: `1px solid ${t.border_card_color}`, background: t.bg_card, fontSize: 13, fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, color: t.text_primary }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Banner — Below Products */}
      {bannerActive && bannerImages.length > 0 && bannerPosition === 'below_products' && (
        <div style={{ maxWidth: t.page_max_width, margin: '0 auto', padding: '0 24px', marginBottom: 32 }}>
          <BannerCarousel images={bannerImages} interval={bannerInterval} accent={accent} radius={t.radius_card} ratio={bannerRatio} />
        </div>
      )}
      <StoreFooter policies={policies} accent={accent} t={t} showEmailSignup={settings?.show_email_signup !== false && settings?.show_contact_feature !== false} showContactFeature={settings?.show_contact_feature !== false} />
    </div>
  )
}