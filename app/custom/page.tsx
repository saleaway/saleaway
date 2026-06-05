'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { mergeTheme, type Theme } from '../theme'
import Nav from '../Nav'
import { StoreFooter } from '../StoreFooter'
import ReactMarkdown from 'react-markdown'

interface Policy { id: string; title: string; content: string; order: number }

export default function CustomPage() {
  const [settings, setSettings] = useState<any>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const cached = localStorage.getItem('siteSettings')
    if (cached) try { setSettings(JSON.parse(cached)) } catch {}
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) { setSettings(data); localStorage.setItem('siteSettings', JSON.stringify(data)) }
    })
    supabase.from('policies').select('*').order('order', { ascending: true }).then(({ data }) => setPolicies(data || []))
  }, [])

  if (!mounted) return (
    <div style={{ minHeight: '100vh', background: '#F5F2EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #eee', borderTop: '3px solid #888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const t = mergeTheme(settings?.theme)
  const accent = settings?.accent_color || '#C0392B'
  const label = settings?.custom_page_label || 'More Info'
  const imageUrl = settings?.custom_page_image_url || ''
  const content = settings?.custom_page_content || ''
  const useMarkdown = settings?.custom_page_markdown !== false

  return (
    <div style={{ fontFamily: t.font_body, background: t.bg_page, minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --accent: ${accent}; }
        .custom-content h1,.custom-content h2,.custom-content h3 { font-family: ${t.font_heading}; color: ${t.text_primary}; margin: 20px 0 10px; }
        .custom-content p { color: ${t.text_secondary}; line-height: 1.8; margin-bottom: 14px; }
        .custom-content ul,.custom-content ol { color: ${t.text_secondary}; line-height: 1.8; padding-left: 20px; margin-bottom: 14px; }
        .custom-content strong { color: ${t.text_primary}; }
        .custom-content a { color: ${accent}; }
      `}} />
      <Nav />
      <div style={{ maxWidth: t.page_max_width, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: t.font_heading, fontSize: 32, fontWeight: t.font_weight_heading, color: t.text_primary, marginBottom: 32 }}>{label}</h1>
        {imageUrl && (
          <img src={imageUrl} alt={label}
            style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: t.radius_card, marginBottom: 32, boxShadow: `0 4px 24px rgba(0,0,0,0.1)` }} />
        )}
        {content && (
          <div className="custom-content" style={{ fontSize: t.font_size_base, maxWidth: 720 }}>
            {useMarkdown
              ? <ReactMarkdown>{content}</ReactMarkdown>
              : <p style={{ color: t.text_secondary, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{content}</p>}
          </div>
        )}
        {!imageUrl && !content && (
          <p style={{ color: t.text_secondary, fontSize: 14 }}>No content yet. Add content from the Developer Panel.</p>
        )}
      </div>
      <StoreFooter policies={policies} accent={accent} t={t}
        showEmailSignup={settings?.show_email_signup !== false && settings?.show_contact_feature !== false}
        showContactFeature={settings?.show_contact_feature !== false} />
    </div>
  )
}