'use client'
import { useState } from 'react'
import { supabase } from './supabase'
import { type Theme } from './theme'

interface Policy { id: string; title: string; content: string; order: number }

export function StoreFooter({ policies, accent, t, showEmailSignup = true, showContactFeature = true }: { policies: Policy[]; accent: string; t: Theme; showEmailSignup?: boolean; showContactFeature?: boolean }) {
  const [showModal, setShowModal] = useState(false)
  const [activePolicyId, setActivePolicyId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle')
  const activePolicy = policies.find(p => p.id === activePolicyId) || null

  const footerBg = t.footer_bg || '#ffffff'
  const footerText = t.footer_text || '#666666'
  const showPoweredBy = t.footer_show_powered_by !== false

  async function handleSubscribe() {
    if (!email.trim() || !email.includes('@')) return
    setSubStatus('loading')
    const { error } = await supabase.from('email_subscribers').insert([{ email: email.trim().toLowerCase() }])
    if (!error) { setSubStatus('success'); setEmail('') }
    else if (error.code === '23505') setSubStatus('duplicate')
    else setSubStatus('error')
  }

  return (
    <>
      <footer style={{ marginTop: 60, borderTop: `1px solid ${t.border_nav_color}`, background: footerBg, fontFamily: t.font_body }}>
        {/* Email signup strip */}
        {showEmailSignup && (
        <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${t.border_card_color}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontFamily: t.font_heading, fontSize: 17, fontWeight: 700, color: footerText, margin: 0 }}>Stay in the loop</p>
            <p style={{ fontSize: 13, color: footerText, opacity: 0.7, margin: '4px 0 0' }}>Get notified about new arrivals and exclusive deals.</p>
          </div>
          {subStatus === 'success'
            ? <p style={{ fontSize: 13, color: '#27AE60', fontWeight: 600 }}>✓ You're subscribed!</p>
            : subStatus === 'duplicate'
            ? <p style={{ fontSize: 13, color: footerText, opacity: 0.7 }}>You're already subscribed.</p>
            : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                  placeholder="Your email address"
                  style={{ padding: '9px 14px', borderRadius: t.radius_btn, border: `1px solid ${t.border_card_color}`, fontSize: 13, background: t.bg_card, color: t.text_primary, minWidth: 220, outline: 'none' }}
                />
                <button onClick={handleSubscribe} disabled={subStatus === 'loading'}
                  style={{ background: accent, color: '#fff', border: 'none', borderRadius: t.radius_btn, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: subStatus === 'loading' ? 0.7 : 1 }}>
                  {subStatus === 'loading' ? '...' : 'Subscribe'}
                </button>
              </div>
            )}
        </div>
        )}

        {/* Bottom bar */}
        <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: t.font_heading, fontSize: 16, color: footerText }}>My<em style={{ color: accent }}>Store</em></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {showContactFeature && (
              <button onClick={() => window.location.href = '/contact'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: footerText, opacity: 0.8, padding: 0 }}>
                Contact
              </button>
            )}
            {policies.length > 0 && (
              <button onClick={() => { setActivePolicyId(policies[0].id); setShowModal(true) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: footerText, textDecoration: 'underline', padding: 0 }}>
                Policies
              </button>
            )}
            {showPoweredBy && (
              <p style={{ fontSize: 13, color: footerText, margin: 0, opacity: 0.7 }}>Secure checkout powered by Stripe</p>
            )}
          </div>
        </div>
      </footer>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: t.bg_card, borderRadius: t.radius_card, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${t.border_card_color}` }}>
              <h2 style={{ fontFamily: t.font_heading, fontSize: 20, margin: 0, color: t.text_primary }}>Policies</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: t.text_secondary, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ width: 180, borderRight: `1px solid ${t.border_card_color}`, overflowY: 'auto', padding: '12px 0', flexShrink: 0 }}>
                {policies.map(pol => (
                  <button key={pol.id} onClick={() => setActivePolicyId(pol.id)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 18px', background: activePolicyId === pol.id ? t.bg_page : 'none', border: 'none', borderLeft: activePolicyId === pol.id ? `3px solid ${accent}` : '3px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: activePolicyId === pol.id ? 600 : 400, color: activePolicyId === pol.id ? t.text_primary : t.text_secondary }}>
                    {pol.title}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                {activePolicy
                  ? <>
                      <h3 style={{ fontFamily: t.font_heading, fontSize: 18, marginBottom: 16, color: t.text_primary }}>{activePolicy.title}</h3>
                      <div style={{ fontSize: t.font_size_base, color: t.text_secondary, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{activePolicy.content}</div>
                    </>
                  : <p style={{ color: t.text_secondary, fontSize: 13 }}>Select a policy from the left.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}