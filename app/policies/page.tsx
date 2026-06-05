'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { mergeTheme, type Theme } from '../theme'
import Nav from '../Nav'
import { StoreFooter } from '../StoreFooter'

interface Policy { id: string; title: string; content: string; order: number }

function renderMarkdown(text: string, textColor: string, secondaryColor: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('## ')) { elements.push(<h2 key={i} style={{ fontSize: 18, fontWeight: 700, color: textColor, margin: '20px 0 8px' }}>{line.slice(3)}</h2>) }
    else if (line.startsWith('### ')) { elements.push(<h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: textColor, margin: '16px 0 6px' }}>{line.slice(4)}</h3>) }
    else if (line.startsWith('- ')) { elements.push(<li key={i} style={{ color: secondaryColor, lineHeight: 1.7, marginLeft: 16 }}>{line.slice(2)}</li>) }
    else if (line.trim() === '') { elements.push(<br key={i} />) }
    else { elements.push(<p key={i} style={{ color: secondaryColor, lineHeight: 1.8, margin: '0 0 10px' }}>{line}</p>) }
    i++
  }
  return elements
}

export default function PoliciesPage() {
  const [settings, setSettings] = useState<any>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [openPolicy, setOpenPolicy] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const cached = localStorage.getItem('siteSettings')
    if (cached) try { setSettings(JSON.parse(cached)) } catch {}
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) { setSettings(data); localStorage.setItem('siteSettings', JSON.stringify(data)) }
    })
    supabase.from('policies').select('*').order('order', { ascending: true }).then(({ data }) => {
      setPolicies(data || [])
      if (data?.length) setOpenPolicy(data[0].id)
    })
  }, [])

  if (!mounted) return (
    <div style={{ minHeight: '100vh', background: '#F5F2EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #eee', borderTop: '3px solid #888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const t = mergeTheme(settings?.theme)
  const accent = settings?.accent_color || '#C0392B'

  return (
    <div style={{ fontFamily: t.font_body, background: t.bg_page, minHeight: '100vh' }}>
      <style>{`:root { --accent: ${accent}; }`}</style>
      <Nav />
      <div style={{ maxWidth: t.page_max_width, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: t.font_heading, fontSize: 32, fontWeight: t.font_weight_heading, color: t.text_primary, marginBottom: 32 }}>
          {settings?.nav_policy_label || 'Policies'}
        </h1>
        {policies.length === 0
          ? <p style={{ color: t.text_secondary }}>No policies yet.</p>
          : policies.map(pol => (
            <div key={pol.id} style={{ background: t.bg_card, borderRadius: t.radius_card, border: `1px solid ${t.border_card_color}`, marginBottom: 12, overflow: 'hidden' }}>
              <button onClick={() => setOpenPolicy(openPolicy === pol.id ? null : pol.id)}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: t.font_heading, fontSize: 16, fontWeight: 700, color: t.text_primary }}>{pol.title}</span>
                <span style={{ color: t.text_secondary, fontSize: 18, transition: 'transform 0.2s', transform: openPolicy === pol.id ? 'rotate(180deg)' : 'none' }}>▾</span>
              </button>
              {openPolicy === pol.id && (
                <div style={{ padding: '0 20px 20px' }}>
                  {renderMarkdown(pol.content, t.text_primary, t.text_secondary)}
                </div>
              )}
            </div>
          ))}
      </div>
      <StoreFooter policies={policies} accent={accent} t={t}
        showEmailSignup={settings?.show_email_signup !== false && settings?.show_contact_feature !== false}
        showContactFeature={settings?.show_contact_feature !== false} />
    </div>
  )
}