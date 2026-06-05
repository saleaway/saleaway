'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { mergeTheme } from '../theme'

export default function SuccessPage() {
  const [settings, setSettings] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      const c = localStorage.getItem('siteSettings')
      if (c) try { return JSON.parse(c) } catch {}
    }
    return null
  })

  useEffect(() => {
    localStorage.removeItem('cart')
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) { setSettings(data); localStorage.setItem('siteSettings', JSON.stringify(data)) }
  }

  const t = mergeTheme(settings?.theme)
  const accent = settings?.accent_color || '#C0392B'

  return (
    <div style={{ fontFamily: t.font_body, background: t.bg_page, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style dangerouslySetInnerHTML={{ __html: `:root { --accent: ${accent}; }` }} />
      <div style={{ background: t.bg_card, borderRadius: t.radius_card, padding: 48, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 440, border: t.border_card_width > 0 ? `${t.border_card_width}px solid ${t.border_card_color}` : 'none' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontFamily: t.font_heading, fontSize: 28, marginBottom: 8, color: t.text_primary, fontWeight: t.font_weight_heading }}>Order Confirmed!</h1>
        <p style={{ fontSize: t.font_size_base, color: t.text_secondary, lineHeight: 1.7, marginBottom: 24 }}>
          Thank you for your purchase! You'll receive a confirmation email shortly with your order details.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          style={{ background: accent, color: '#fff', border: 'none', borderRadius: t.radius_btn, padding: '12px 28px', fontWeight: t.font_weight_btn, cursor: 'pointer', fontSize: t.font_size_base }}
        >
          ← Back to Store
        </button>
      </div>
    </div>
  )
}