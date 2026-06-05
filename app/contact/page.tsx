'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { mergeTheme } from '../theme'
import Nav from '../Nav'
import { StoreFooter } from '../StoreFooter'

interface Policy { id: string; title: string; content: string; order: number }

export default function ContactPage() {
  const [settings, setSettings] = useState<any | null>(null)
  const [mounted, setMounted] = useState(false)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    setMounted(true)
    const cached = localStorage.getItem('siteSettings')
    if (cached) try { setSettings(JSON.parse(cached)) } catch {}
    fetchSettings()
    fetchPolicies()
  }, [])

  if (!mounted) return null

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) { setSettings(data); localStorage.setItem('siteSettings', JSON.stringify(data)) }
  }
  async function fetchPolicies() {
    const { data } = await supabase.from('policies').select('*').order('order', { ascending: true })
    setPolicies(data || [])
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    setStatus('loading')
    const { error } = await supabase.from('contact_submissions').insert([{
      name: form.name.trim(), email: form.email.trim(),
      phone: form.phone.trim() || null, message: form.message.trim()
    }])
    if (!error) { setStatus('success'); setForm({ name: '', email: '', phone: '', message: '' }) }
    else setStatus('error')
  }

  const t = mergeTheme(settings?.theme)
  const accent = settings?.accent_color || '#C0392B'
  const contactInfo = settings?.contact_info || {}

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    borderRadius: t.radius_input, border: `1px solid ${t.border_card_color}`,
    fontSize: t.font_size_base, background: t.bg_card, color: t.text_primary,
    outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: t.font_body,
  }

  return (
    <div style={{ fontFamily: t.font_body, background: t.bg_page, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --accent: ${accent}; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;700&display=swap');
        .contact-input:focus { border-color: ${accent} !important; box-shadow: 0 0 0 3px ${accent}22; }
      ` }} />
      <Nav />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: t.font_heading, fontSize: 36, fontWeight: t.font_weight_heading, color: t.text_primary, marginBottom: 40 }}>Contact</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, marginBottom: 48 }}>
          {/* Info panel */}
          <div>
            {contactInfo.whatsapp_url && (
              <div style={{ marginBottom: 28 }}>
                <a href={contactInfo.whatsapp_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(contactInfo.whatsapp_url)}`}
                    alt="WhatsApp QR"
                    style={{ width: 160, height: 160, borderRadius: 8, border: `1px solid ${t.border_card_color}` }}
                  />
                </a>
                <p style={{ fontSize: 12, color: t.text_secondary, marginTop: 6 }}>Scan to open WhatsApp</p>
              </div>
            )}

            <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 20 }}>
              <h2 style={{ fontFamily: t.font_heading, fontSize: 26, color: t.text_primary, marginBottom: 12, fontWeight: t.font_weight_heading }}>
                {contactInfo.headline || 'Questions?'}
              </h2>
              <p style={{ fontSize: t.font_size_base, color: t.text_secondary, lineHeight: 1.7, marginBottom: 16 }}>
                {contactInfo.intro || "We're here to help!"}
              </p>

              {contactInfo.phone && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: t.font_size_base, color: t.text_primary }}>
                    <strong>Call or WhatsApp:</strong>{' '}
                    <a href={`tel:${contactInfo.phone}`} style={{ color: accent, textDecoration: 'none' }}>{contactInfo.phone}</a>
                  </span>
                </div>
              )}

              {contactInfo.email && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: t.font_size_base, color: t.text_primary }}>
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${contactInfo.email}`} style={{ color: accent, textDecoration: 'none' }}>{contactInfo.email}</a>
                    {' '}or use the form below
                  </span>
                </div>
              )}

              {contactInfo.extra && (
                <p style={{ fontSize: t.font_size_base, color: t.text_secondary, marginTop: 12, lineHeight: 1.6 }}>{contactInfo.extra}</p>
              )}
            </div>
          </div>

          {/* Vertical divider (desktop) */}
          <div style={{ borderLeft: `1px solid ${t.border_card_color}`, display: 'none' }} className="contact-divider" />
        </div>

        {/* Contact form */}
        {status === 'success'
          ? (
            <div style={{ background: '#EAF3DE', border: '1px solid #b3d98a', borderRadius: t.radius_card, padding: '28px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <h3 style={{ fontFamily: t.font_heading, fontSize: 20, color: '#3B6D11', marginBottom: 8 }}>Message sent!</h3>
              <p style={{ fontSize: t.font_size_base, color: '#3B6D11' }}>We'll get back to you as soon as possible.</p>
              <button onClick={() => setStatus('idle')} style={{ marginTop: 16, background: accent, color: '#fff', border: 'none', borderRadius: t.radius_btn, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Send another message</button>
            </div>
          ) : (
            <div style={{ background: t.bg_card, borderRadius: t.radius_card, padding: '32px', border: `1px solid ${t.border_card_color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: t.text_secondary, display: 'block', marginBottom: 6 }}>Name *</label>
                  <input className="contact-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: t.text_secondary, display: 'block', marginBottom: 6 }}>Email *</label>
                  <input className="contact-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: t.text_secondary, display: 'block', marginBottom: 6 }}>Phone number</label>
                <input className="contact-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Optional" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: t.text_secondary, display: 'block', marginBottom: 6 }}>Message *</label>
                <textarea className="contact-input" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {status === 'error' && <p style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>Something went wrong. Please try again.</p>}
              <button onClick={handleSubmit} disabled={status === 'loading' || !form.name.trim() || !form.email.trim() || !form.message.trim()}
                style={{ background: accent, color: '#fff', border: 'none', borderRadius: t.radius_btn, padding: '13px 32px', fontWeight: 700, cursor: 'pointer', fontSize: t.font_size_base, opacity: (status === 'loading' || !form.name.trim() || !form.email.trim() || !form.message.trim()) ? 0.6 : 1, boxShadow: `0 4px 16px ${accent}44` }}>
                {status === 'loading' ? 'Sending...' : 'Send'}
              </button>
            </div>
          )}
      </div>

      <StoreFooter policies={policies} accent={accent} t={t} showEmailSignup={settings?.show_email_signup !== false} />
    </div>
  )
}