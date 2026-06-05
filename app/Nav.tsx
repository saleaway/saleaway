'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { mergeTheme, type Theme } from './theme'

interface Settings {
  store_name: string; logo_url: string; accent_color: string
  show_contact_nav?: boolean; show_contact_feature?: boolean
  show_nav_policy?: boolean; nav_policy_label?: string; nav_contact_label?: string
  custom_page_enabled?: boolean; custom_page_label?: string
  theme?: Partial<Theme>
}

function getInitialSettings(): Settings | null {
  if (typeof window === 'undefined') return null
  try { const c = localStorage.getItem('siteSettings'); return c ? JSON.parse(c) : null } catch { return null }
}

export default function Nav({ cartCount, bounce }: { cartCount?: number; bounce?: boolean }) {
  const [settings, setSettings] = useState<Settings | null>(getInitialSettings)
  const [localCartCount, setLocalCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSettings()
    const stored = localStorage.getItem('cart')
    if (stored) { const c = JSON.parse(stored); setLocalCartCount(c.reduce((a: number, b: { qty: number }) => a + b.qty, 0)) }
    const hv = () => { const s = localStorage.getItem('cart'); if (s) { const c = JSON.parse(s); setLocalCartCount(c.reduce((a: number, b: { qty: number }) => a + b.qty, 0)) } else setLocalCartCount(0) }
    window.addEventListener('focus', hv); document.addEventListener('visibilitychange', hv); window.addEventListener('storage', hv)
    return () => { window.removeEventListener('focus', hv); document.removeEventListener('visibilitychange', hv); window.removeEventListener('storage', hv) }
  }, [])

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) { setSettings(data); localStorage.setItem('siteSettings', JSON.stringify(data)) }
  }

  const t = mergeTheme(settings?.theme)
  const accent = settings?.accent_color || '#C0392B'
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

  const showContact = settings?.show_contact_nav !== false && settings?.show_contact_feature !== false
  const showPolicy = settings?.show_nav_policy === true
  const showCustom = settings?.custom_page_enabled === true
  const contactLabel = settings?.nav_contact_label || 'Contact'
  const policyLabel = settings?.nav_policy_label || 'Policies'
  const customLabel = settings?.custom_page_label || 'More Info'

  const navButtons = [
    ...(showContact ? [{ label: contactLabel, path: '/contact' }] : []),
    ...(showPolicy ? [{ label: policyLabel, path: '/policies' }] : []),
    ...(showCustom ? [{ label: customLabel, path: '/custom' }] : []),
  ]

  const logoH = (t.nav_logo_height || 36)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --accent: ${accent}; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700;900&family=Playfair+Display:wght@400;700&display=swap');
        .nav-btn { background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 500; padding: 6px 10px; border-radius: 6px; transition: background 0.15s, opacity 0.15s; opacity: 0.75; }
        .nav-btn:hover { opacity: 1; background: rgba(128,128,128,0.1); }
        .nav-btn.active { opacity: 1; font-weight: 700; }
        .cart-short { display: none; }
        .cart-full { display: inline; }
        @media (max-width: 640px) { .cart-short { display: inline; } .cart-full { display: none; } }
        .hamburger-menu { position: absolute; top: 100%; right: 16px; min-width: 160px; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 200; }
        .hamburger-item { width: 100%; text-align: left; border: none; cursor: pointer; padding: 12px 18px; font-size: 14px; font-weight: 500; transition: background 0.1s; }
        .hamburger-item:hover { filter: brightness(0.95); }
        @media (max-width: 640px) { .nav-links-desktop { display: none !important; } .nav-hamburger { display: flex !important; } }
        @media (min-width: 641px) { .nav-hamburger { display: none !important; } .nav-links-desktop { display: flex !important; } }
      ` }} />
      <nav style={{
        position: t.nav_sticky ? 'sticky' : 'relative', top: 0, zIndex: 100,
        background: t.bg_nav, backdropFilter: t.bg_nav.includes('rgba') ? 'blur(12px)' : 'none',
        borderBottom: `1px solid ${t.border_nav_color}`, padding: '0 16px',
        height: t.nav_height, display: 'flex', alignItems: 'center', gap: 8, fontFamily: t.font_body,
      }}>

        {/* Logo */}
        <div onClick={() => window.location.href = '/'} style={{ fontFamily: t.font_heading, fontSize: 20, fontWeight: t.font_weight_heading, flex: 1, color: t.text_nav, cursor: 'pointer' }}>
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="logo" style={{ height: logoH, objectFit: 'contain' }} />
            : <span>{settings?.store_name || 'Sale Away'}</span>}
        </div>

        {/* Desktop nav links */}
        {navButtons.length > 0 && (
          <div className="nav-links-desktop" style={{ alignItems: 'center', gap: 2 }}>
            {navButtons.map(btn => (
              <button key={btn.path} onClick={() => window.location.href = btn.path}
                className={`nav-btn${currentPath === btn.path ? ' active' : ''}`}
                style={{ color: t.text_nav }}>
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Mobile hamburger */}
        {navButtons.length > 0 && (
          <div ref={menuRef} className="nav-hamburger" style={{ position: 'relative', alignItems: 'center' }}>
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: `1px solid ${t.border_nav_color}`, borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 0 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ display: 'block', width: 16, height: 2, background: t.text_nav, borderRadius: 2, transition: 'all 0.2s',
                  ...(menuOpen && i === 0 ? { transform: 'rotate(45deg) translate(4px, 4px)' } : {}),
                  ...(menuOpen && i === 1 ? { opacity: 0 } : {}),
                  ...(menuOpen && i === 2 ? { transform: 'rotate(-45deg) translate(4px, -4px)' } : {}),
                }} />
              ))}
            </button>
            {menuOpen && (
              <div className="hamburger-menu" style={{ background: t.bg_nav || '#fff', border: `1px solid ${t.border_nav_color}` }}>
                {navButtons.map(btn => (
                  <button key={btn.path} className="hamburger-item"
                    onClick={() => { window.location.href = btn.path; setMenuOpen(false) }}
                    style={{ background: currentPath === btn.path ? `${accent}18` : 'transparent', color: currentPath === btn.path ? accent : t.text_nav, fontFamily: t.font_body }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cart */}
        <button onClick={() => window.location.href = '/cart'} style={{
          background: accent, color: '#fff', border: 'none', borderRadius: t.radius_btn,
          padding: '8px 16px', fontWeight: t.font_weight_btn, cursor: 'pointer', fontSize: 13,
          transform: bounce ? 'scale(1.3)' : 'scale(1)', transition: 'all 0.2s ease',
          boxShadow: `0 4px 12px ${accent}4D`, flexShrink: 0,
        }}>
          <span className="cart-full">🛒 Cart ({cartCount ?? localCartCount})</span>
          <span className="cart-short">🛒 {cartCount ?? localCartCount}</span>
        </button>
      </nav>
    </>
  )
}