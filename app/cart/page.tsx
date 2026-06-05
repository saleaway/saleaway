'use client'
import { useEffect, useState } from 'react'
import { useIsMobile } from '../useIsMobile'
import { supabase } from '../supabase'
import Nav from '../Nav'
import { mergeTheme } from '../theme'

interface CartItem {
  id: string; name: string; price: number; sale_price?: number | null
  qty: number; image_url: string; category: string; stock: number
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [settings, setSettings] = useState<any | null>(() => {
    if (typeof window !== 'undefined') { const c = localStorage.getItem('siteSettings'); if (c) try { return JSON.parse(c) } catch {} }
    return null
  })
  const isMobile = useIsMobile()

  useEffect(() => {
    const stored = localStorage.getItem('cart'); if (stored) setCart(JSON.parse(stored))
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) { setSettings(data); localStorage.setItem('siteSettings', JSON.stringify(data)) }
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeFromCart(id); return }
    const updated = cart.map(x => x.id === id ? { ...x, qty } : x)
    setCart(updated); localStorage.setItem('cart', JSON.stringify(updated))
  }
  function removeFromCart(id: string) {
    const updated = cart.filter(x => x.id !== id)
    setCart(updated); localStorage.setItem('cart', JSON.stringify(updated))
  }

  const cartTotal = cart.reduce((a, b) => a + (b.sale_price ?? b.price) * b.qty, 0)

  async function checkout() {
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart }) })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Checkout failed.')
    } catch { alert('Checkout error.') }
  }

  if (!settings) return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F5F2EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #eee', borderTop: '3px solid #888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const t = mergeTheme(settings?.theme)
  const accent = settings?.accent_color || '#C0392B'

  return (
    <div style={{ fontFamily: t.font_body, background: t.bg_page, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `:root { --accent: ${accent}; }` }} />
      <Nav />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: t.font_heading, fontSize: 28, marginBottom: 24, letterSpacing: -0.5, color: t.text_primary, fontWeight: t.font_weight_heading }}>
          Your <em style={{ color: accent }}>Cart</em>
        </h1>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', background: t.bg_card, borderRadius: t.radius_card, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🛒</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: t.text_primary }}>Your cart is empty</h3>
            <p style={{ fontSize: t.font_size_base, color: t.text_secondary, marginBottom: 24 }}>Browse our store and add some items!</p>
            <button onClick={() => window.location.href = '/'} style={{ background: accent, color: '#fff', border: 'none', borderRadius: t.radius_btn, padding: '10px 24px', fontWeight: t.font_weight_btn, cursor: 'pointer', fontSize: t.font_size_base }}>Browse Store</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 24, alignItems: 'start' }}>
            <div>
              {cart.map(item => (
  <div key={item.id} style={{ background: t.bg_card, borderRadius: t.radius_card, padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: t.border_card_width > 0 ? `${t.border_card_width}px solid ${t.border_card_color}` : 'none' }}>
    <img onClick={() => window.location.href = `/product/${item.id}`} src={item.image_url || 'https://via.placeholder.com/80?text=No+Image'} alt={item.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: t.radius_image || t.radius_card, flexShrink: 0, cursor: 'pointer' }} />
    <div style={{ flex: 1 }}>
      <p onClick={() => window.location.href = `/product/${item.id}`} style={{ fontSize: t.font_size_base, fontWeight: 600, marginBottom: 4, color: t.text_primary, cursor: 'pointer' }}>{item.name}</p>
      <p style={{ fontSize: 12, color: t.text_secondary, marginBottom: 8 }}>{item.category}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${t.border_card_color}`, background: t.bg_page, cursor: 'pointer', fontSize: 16, color: t.text_primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
        <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center', color: t.text_primary }}>{item.qty}</span>
        <button onClick={() => { if (item.qty >= (item.stock || 999)) return; updateQty(item.id, item.qty + 1) }} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${t.border_card_color}`, background: t.bg_page, cursor: 'pointer', fontSize: 16, color: t.text_primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <p style={{ fontSize: 16, fontWeight: 700, color: t.text_price || accent, marginBottom: 8 }}>${((item.sale_price ?? item.price) * item.qty).toFixed(2)}</p>
      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: `1px solid ${t.border_card_color}`, borderRadius: t.radius_btn > 8 ? 6 : t.radius_btn, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: t.text_secondary }}>Remove</button>
    </div>
  </div>
))}
            </div>

            <div style={{ background: t.bg_card, borderRadius: t.radius_card, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'sticky', top: t.nav_height + 18, border: t.border_card_width > 0 ? `${t.border_card_width}px solid ${t.border_card_color}` : 'none' }}>
              <h3 style={{ fontFamily: t.font_heading, fontSize: 20, marginBottom: 16, color: t.text_primary }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: t.font_size_base, marginBottom: 8, color: t.text_secondary }}>
                <span>Items ({cart.reduce((a, b) => a + b.qty, 0)})</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, color: t.text_primary, borderTop: `1px solid ${t.border_card_color}`, paddingTop: 14, marginTop: 8 }}>
                <span>Total</span><span>${cartTotal.toFixed(2)}</span>
              </div>
              <button onClick={checkout} style={{ width: '100%', marginTop: 16, background: '#185FA5', color: '#fff', border: 'none', borderRadius: t.radius_btn, padding: 13, fontWeight: t.font_weight_btn, cursor: 'pointer', fontSize: t.font_size_base }}>Checkout with Stripe →</button>
              <button onClick={() => window.location.href = '/'} style={{ width: '100%', marginTop: 8, background: 'none', color: t.text_primary, border: `1px solid ${t.border_card_color}`, borderRadius: t.radius_btn, padding: 11, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>← Continue Shopping</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}