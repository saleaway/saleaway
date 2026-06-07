'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { DEFAULT_THEME, mergeTheme, type Theme } from '../theme'

const ALL_SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_az', label: 'Name: A–Z' },
  { value: 'name_za', label: 'Name: Z–A' },
]
interface SortOption { value: string; label: string; enabled: boolean }

const D = {
  bg: '#1e1e2e', panel: '#2a2a3e', card: '#32324a', border: '#44445a',
  text: '#e8e8f0', textMuted: '#9999bb', input: '#3a3a52', inputBorder: '#55556a',
  label: '#c0c0d8', sectionTitle: '#8888aa',
}

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, color: D.label, display: 'block', marginBottom: 5, fontWeight: 600, letterSpacing: 0.2 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: D.textMuted, marginTop: 4 }}>{hint}</p>}
    </div>
  )
}
function ColorRow({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Row label={label} hint={hint}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={value || '#ffffff'} onChange={e => onChange(e.target.value)} style={{ width: 40, height: 32, borderRadius: 6, border: `1px solid ${D.inputBorder}`, cursor: 'pointer', padding: 2, background: 'transparent' }} />
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="#rrggbb or rgba(...)" style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: `1px solid ${D.inputBorder}`, fontSize: 12, background: D.input, color: D.text }} />
      </div>
    </Row>
  )
}
function SliderRow({ label, value, min, max, step = 1, unit = 'px', onChange, hint }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void; hint?: string }) {
  return (
    <Row label={`${label} — ${value}${unit}`} hint={hint}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
    </Row>
  )
}
function SelectRow({ label, value, options, onChange, hint }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; hint?: string }) {
  return (
    <Row label={label} hint={hint}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${D.inputBorder}`, fontSize: 12, background: D.input, color: D.text }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Row>
  )
}
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '9px 12px', background: value ? '#1a3a1a' : '#3a1a1a', borderRadius: 8, border: `1px solid ${value ? '#2d6b2d' : '#6b2d2d'}` }}>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ accentColor: value ? '#4caf50' : '#e53935' }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: value ? '#88dd88' : '#dd8888' }}>{label}</span>
    </div>
  )
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: D.sectionTitle, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${D.border}` }}>{title}</h3>
      {children}
    </div>
  )
}
function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: D.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</p>
      <div style={{ paddingLeft: 12, borderLeft: `2px solid ${D.border}` }}>{children}</div>
    </div>
  )
}
function ChipRow({ label, options, value, onChange, hint }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Row label={label} hint={hint}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${value === o.value ? 'var(--accent)' : D.inputBorder}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: value === o.value ? 'var(--accent)' : D.input, color: value === o.value ? '#fff' : D.text, transition: 'all 0.15s' }}>
            {o.label}
          </button>
        ))}
      </div>
    </Row>
  )
}

const HEADING_FONTS = [
  { value: 'Georgia, serif', label: 'Georgia — classic serif' },
  { value: "'Playfair Display', serif", label: 'Playfair Display — elegant editorial' },
  { value: "'Cormorant Garamond', serif", label: 'Cormorant Garamond — refined luxury' },
  { value: "'Lora', serif", label: 'Lora — warm literary' },
  { value: "'Merriweather', serif", label: 'Merriweather — strong readable' },
  { value: "'Libre Baskerville', serif", label: 'Libre Baskerville — bold classic' },
  { value: "'Yeseva One', serif", label: 'Yeseva One — elegant display' },
  { value: "'Rozha One', serif", label: 'Rozha One — bold serif impact' },
  { value: "'DM Sans', sans-serif", label: 'DM Sans — clean modern' },
  { value: "'Inter', sans-serif", label: 'Inter — neutral minimal' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat — bold geometric' },
  { value: "'Raleway', sans-serif", label: 'Raleway — stylish light' },
  { value: "'Poppins', sans-serif", label: 'Poppins — modern rounded' },
  { value: "'Josefin Sans', sans-serif", label: 'Josefin Sans — geometric chic' },
  { value: "'Nunito', sans-serif", label: 'Nunito — rounded friendly' },
  { value: "'Oswald', sans-serif", label: 'Oswald — condensed bold' },
  { value: "'Bebas Neue', cursive", label: 'Bebas Neue — all-caps impact' },
  { value: "'Righteous', cursive", label: 'Righteous — retro bold' },
  { value: "'Secular One', sans-serif", label: 'Secular One — strong geometric' },
  { value: "'Abril Fatface', cursive", label: 'Abril Fatface — dramatic ink' },
  { value: "'Pacifico', cursive", label: 'Pacifico — bold handwritten' },
  { value: "'Lobster', cursive", label: 'Lobster — classic script' },
  { value: "'Satisfy', cursive", label: 'Satisfy — flowing elegant script' },
  { value: "'Dancing Script', cursive", label: 'Dancing Script — casual handwritten' },
  { value: "'Great Vibes', cursive", label: 'Great Vibes — luxury calligraphy' },
  { value: "'Cinzel', serif", label: 'Cinzel — Roman engraved / metallic' },
  { value: "'Fredoka One', cursive", label: 'Fredoka One — rounded chunky' },
  { value: 'system-ui, sans-serif', label: 'System UI — device default' },
]
const BODY_FONTS = [
  { value: "'DM Sans', sans-serif", label: 'DM Sans — friendly modern' },
  { value: "'Inter', sans-serif", label: 'Inter — clean neutral' },
  { value: "'Lato', sans-serif", label: 'Lato — readable classic' },
  { value: "'Nunito', sans-serif", label: 'Nunito — rounded warm' },
  { value: "'Poppins', sans-serif", label: 'Poppins — modern rounded' },
  { value: "'Source Sans 3', sans-serif", label: 'Source Sans 3 — clear editorial' },
  { value: "'Raleway', sans-serif", label: 'Raleway — stylish light' },
  { value: "'Open Sans', sans-serif", label: 'Open Sans — universally readable' },
  { value: "'Karla', sans-serif", label: 'Karla — quirky minimal' },
  { value: "'Manrope', sans-serif", label: 'Manrope — sharp modern' },
  { value: "'Mulish', sans-serif", label: 'Mulish — clean geometric' },
  { value: "'Quicksand', sans-serif", label: 'Quicksand — soft rounded' },
  { value: 'Georgia, serif', label: 'Georgia — traditional warm' },
  { value: "'Lora', serif", label: 'Lora — literary serif' },
  { value: 'system-ui, sans-serif', label: 'System UI — device default' },
]
const ALL_FONTS_IMPORT = 'Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Lora:wght@400;700&family=Merriweather:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Yeseva+One&family=Rozha+One&family=DM+Sans:wght@400;700&family=Inter:wght@400;700&family=Montserrat:wght@400;700&family=Raleway:wght@400;700&family=Poppins:wght@400;700&family=Josefin+Sans:wght@400;700&family=Nunito:wght@400;700&family=Oswald:wght@400;700&family=Bebas+Neue&family=Righteous&family=Secular+One&family=Abril+Fatface&family=Pacifico&family=Lobster&family=Satisfy&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Cinzel:wght@400;700&family=Fredoka+One&family=Lato:wght@400;700&family=Source+Sans+3:wght@400;700&family=Open+Sans:wght@400;700&family=Karla:wght@400;700&family=Manrope:wght@400;700&family=Mulish:wght@400;700&family=Quicksand:wght@400;700'

export default function DevPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [settingsId, setSettingsId] = useState<string>('')
  const [settingsForm, setSettingsForm] = useState({
    store_name: '', accent_color: '#C0392B', hero_headline: '', hero_subtext: '',
    hero_emoji: '', hero_image_url: '', favicon_url: '', media_active: false, media_type: 'image',
    media_url: '', media_position: 'below_hero', media_autoplay: false,
    media_overlay: false, media_thumbnail_url: '', hero_visible: true,
    show_similar_products: true,
    // New fields
    scroll_effect: 'fade_up',
    scroll_behavior: 'once',
    banner_active: false,
    banner_interval: 3,
    banner_ratio: '16/5',
    banner_position: 'below_hero',
    banner_transition: 'fade',
    product_transition: 'fade',
    show_contact_nav: true,
    show_email_signup: true,
    show_contact_feature: true,
    contact_notification_sound: true,
    show_nav_policy: false,
    nav_policy_label: 'Policies',
    nav_contact_label: 'Contact',
    custom_page_enabled: false,
    custom_page_label: 'More Info',
    custom_page_image_url: '',
    custom_page_content: '',
    custom_page_markdown: true,
    contact_info: { headline: '', intro: '', phone: '', email: '', whatsapp_url: '', extra: '' },
  })
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  const [sortOptions, setSortOptions] = useState<SortOption[]>([
    { value: 'featured', label: 'Featured', enabled: true },
    { value: 'newest', label: 'Most Recent', enabled: true },
    { value: 'oldest', label: 'Oldest First', enabled: true },
    { value: 'price_asc', label: 'Price: Low to High', enabled: true },
    { value: 'price_desc', label: 'Price: High to Low', enabled: true },
    { value: 'name_az', label: 'Name: A–Z', enabled: true },
    { value: 'name_za', label: 'Name: Z–A', enabled: false },
  ])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [heroImagePreview, setHeroImagePreview] = useState('')
  const [heroBgFile, setHeroBgFile] = useState<File | null>(null)
  const [heroBgPreview, setHeroBgPreview] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  // Banner images
  const [bannerImages, setBannerImages] = useState<{ url: string; link: string }[]>([])
  const [bannerUploading, setBannerUploading] = useState(false)
  const [customImageFile, setCustomImageFile] = useState<File | null>(null)
  const [customImageUploading, setCustomImageUploading] = useState(false)

  const setT = (k: keyof Theme, v: any) => setTheme(prev => ({ ...prev, [k]: v }))
  const sf = (k: string, v: any) => setSettingsForm(prev => ({ ...prev, [k]: v }))
  const setCI = (k: string, v: string) => setSettingsForm(prev => ({ ...prev, contact_info: { ...(prev.contact_info as any), [k]: v } }))

  useEffect(() => { if (authed) fetchSettings() }, [authed])

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) {
      setSettingsId(data.id)
      setSettingsForm({
        store_name: data.store_name || '', accent_color: data.accent_color || '#C0392B',
        hero_headline: data.hero_headline || '', hero_subtext: data.hero_subtext || '',
        hero_emoji: data.hero_emoji || '', hero_image_url: data.hero_image_url || '',
        favicon_url: data.favicon_url || '',
        media_active: data.media_active || false, media_type: data.media_type || 'image',
        media_url: data.media_url || '', media_position: data.media_position || 'below_hero',
        media_autoplay: data.media_autoplay || false, media_overlay: data.media_overlay || false,
        media_thumbnail_url: data.media_thumbnail_url || '',
        hero_visible: data.hero_visible !== false,
        show_similar_products: data.show_similar_products !== false,
        scroll_effect: data.scroll_effect || 'fade_up',
        scroll_behavior: data.scroll_behavior || 'once',
        banner_active: data.banner_active || false,
        banner_interval: data.banner_interval || 3,
        banner_ratio: data.banner_ratio || '16/5',
        banner_position: data.banner_position || 'below_hero',
        banner_transition: data.banner_transition || 'fade',
        product_transition: data.product_transition || 'fade',
        show_contact_nav: data.show_contact_nav !== false,
        show_email_signup: data.show_email_signup !== false,
        show_contact_feature: data.show_contact_feature !== false,
        contact_notification_sound: data.contact_notification_sound !== false,
        show_nav_policy: data.show_nav_policy || false,
        nav_policy_label: data.nav_policy_label || 'Policies',
        nav_contact_label: data.nav_contact_label || 'Contact',
        custom_page_enabled: data.custom_page_enabled || false,
        custom_page_label: data.custom_page_label || 'More Info',
        custom_page_image_url: data.custom_page_image_url || '',
        custom_page_content: data.custom_page_content || '',
        custom_page_markdown: data.custom_page_markdown !== false,
        contact_info: data.contact_info || { headline: '', intro: '', phone: '', email: '', whatsapp_url: '', extra: '' },
      })
      if (data.logo_url) setLogoPreview(data.logo_url)
      if (data.hero_image_url) setHeroImagePreview(data.hero_image_url)
      if (data.banner_images?.length) {
        setBannerImages(data.banner_images.map((item: any) =>
          typeof item === 'string' ? { url: item, link: '' } : item
        ))
      }
      if (data.sort_options?.length > 0) {
        const saved: SortOption[] = data.sort_options
        const savedValues = saved.map((o: SortOption) => o.value)
        const newOnes = ALL_SORT_OPTIONS.filter(o => !savedValues.includes(o.value)).map(o => ({ ...o, enabled: false }))
        setSortOptions([...saved, ...newOnes])
      }
      const merged = mergeTheme(data.theme)
      setTheme(merged)
      if (merged.hero_bg_image_url) setHeroBgPreview(merged.hero_bg_image_url)
    }
  }

  async function uploadBannerImage(file: File) {
    setBannerUploading(true)
    const ext = file.name.split('.').pop()
    const name = `banner-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(name, file)
    if (!error) {
      const { data: ud } = supabase.storage.from('product-images').getPublicUrl(name)
      setBannerImages(prev => [...prev, { url: ud.publicUrl, link: '' }])
    }
    setBannerUploading(false)
  }

  async function uploadCustomImage(file: File) {
    setCustomImageUploading(true)
    const ext = file.name.split('.').pop()
    const name = `custom-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(name, file)
    if (!error) {
      const { data: ud } = supabase.storage.from('product-images').getPublicUrl(name)
      sf('custom_page_image_url', ud.publicUrl)
    }
    setCustomImageUploading(false)
  }

  async function saveSettings() {
    if (!settingsId) {
      // Try to get the ID one more time
      const { data } = await supabase.from('settings').select('id').single()
      if (!data?.id) { alert('Error: Could not find settings record. Make sure the settings table has a row.'); return }
      setSettingsId(data.id)
    }
    const idToUse = settingsId || (await supabase.from('settings').select('id').single()).data?.id
    if (!idToUse) { alert('Error: No settings ID found.'); return }
    setLoading(true)
    let logo_url = logoPreview
    let hero_image_url = settingsForm.hero_image_url
    let media_url = settingsForm.media_url
    let media_thumbnail_url = settingsForm.media_thumbnail_url
    let hero_bg_image_url = theme.hero_bg_image_url || ''

    for (const [file, prefix, setter] of [
      [heroImageFile, 'hero', (url: string) => { hero_image_url = url }],
      [heroBgFile, 'herobg', (url: string) => { hero_bg_image_url = url }],
      [videoFile, 'video', (url: string) => { media_url = url }],
      [thumbnailFile, 'thumbnail', (url: string) => { media_thumbnail_url = url }],
      [logoFile, 'logo', (url: string) => { logo_url = url }],
    ] as [File | null, string, (url: string) => void][]) {
      if (file) {
        const ext = file.name.split('.').pop()
        const name = `${prefix}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('product-images').upload(name, file)
        if (!upErr) { const { data: ud } = supabase.storage.from('product-images').getPublicUrl(name); setter(ud.publicUrl) }
      }
    }
    const finalTheme = { ...theme, hero_bg_image_url }
    const updatedSettings = {
      id: settingsId,
      store_name: settingsForm.store_name,
      accent_color: settingsForm.accent_color,
      favicon_url: settingsForm.favicon_url,
      hero_headline: settingsForm.hero_headline,
      hero_subtext: settingsForm.hero_subtext,
      hero_emoji: settingsForm.hero_emoji,
      hero_image_url,
      hero_visible: settingsForm.hero_visible,
      logo_url,
      media_active: settingsForm.media_active,
      media_type: settingsForm.media_type,
      media_url,
      media_position: settingsForm.media_position,
      media_autoplay: settingsForm.media_autoplay,
      media_overlay: settingsForm.media_overlay,
      media_thumbnail_url,
      show_similar_products: settingsForm.show_similar_products,
      sort_options: sortOptions,
      theme: finalTheme,
      scroll_effect: settingsForm.scroll_effect,
      scroll_behavior: settingsForm.scroll_behavior,
      banner_images: bannerImages,
      banner_active: settingsForm.banner_active,
      banner_interval: settingsForm.banner_interval,
      banner_ratio: settingsForm.banner_ratio,
      banner_position: settingsForm.banner_position,
      banner_transition: settingsForm.banner_transition,
      product_transition: settingsForm.product_transition,
      show_contact_nav: settingsForm.show_contact_nav,
      show_email_signup: settingsForm.show_email_signup,
      show_contact_feature: settingsForm.show_contact_feature,
      contact_notification_sound: settingsForm.contact_notification_sound,
      show_nav_policy: settingsForm.show_nav_policy,
      nav_policy_label: settingsForm.nav_policy_label,
      nav_contact_label: settingsForm.nav_contact_label,
      custom_page_enabled: settingsForm.custom_page_enabled,
      custom_page_label: settingsForm.custom_page_label,
      custom_page_image_url: settingsForm.custom_page_image_url,
      custom_page_content: settingsForm.custom_page_content,
      custom_page_markdown: settingsForm.custom_page_markdown,
      contact_info: settingsForm.contact_info,
    }
    const { error: saveError } = await supabase.from('settings').update(updatedSettings).eq('id', idToUse)
    if (saveError) {
      setLoading(false)
      alert(`❌ Save failed: ${saveError.message}`)
      return
    }
    localStorage.setItem('siteSettings', JSON.stringify({ ...updatedSettings, id: idToUse }))
    // Update local state directly from what we just saved — don't re-fetch
    // (re-fetching causes the theme to be overwritten by a stale Supabase response)
    setLogoPreview(logo_url)
    setHeroImagePreview(hero_image_url)
    setHeroImageFile(null)
    setHeroBgFile(null)
    setLogoFile(null)
    setVideoFile(null)
    setThumbnailFile(null)
    setTheme(finalTheme)
    setSettingsForm(prev => ({ ...prev, logo_url, media_url, media_thumbnail_url, hero_image_url }))
    setLoading(false)
    alert('✓ Settings saved!')
  }

  function login() {
    if (password === process.env.NEXT_PUBLIC_DEV_PASSWORD) { setAuthed(true); setError('') }
    else { setError('Incorrect password. Try again.') }
  }
  function handleDragStart(i: number) { setDragIndex(i) }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) return
    const u = [...sortOptions]; const [m] = u.splice(dragIndex, 1); u.splice(i, 0, m)
    setSortOptions(u); setDragIndex(i)
  }
  function handleDragEnd() { setDragIndex(null) }
  function updateSortLabel(i: number, label: string) { const u = [...sortOptions]; u[i] = { ...u[i], label }; setSortOptions(u) }
  function toggleSortEnabled(i: number) { const u = [...sortOptions]; u[i] = { ...u[i], enabled: !u[i].enabled }; setSortOptions(u) }

  const accent = settingsForm.accent_color || '#C0392B'
  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${D.inputBorder}`, fontSize: 13, background: D.input, color: D.text, boxSizing: 'border-box' as const }
  const ci = settingsForm.contact_info as any

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${ALL_FONTS_IMPORT}&display=swap');`}</style>
      <div style={{ background: D.panel, borderRadius: 16, padding: 40, width: 340, boxShadow: '0 8px 40px rgba(0,0,0,0.4)', border: `1px solid ${D.border}` }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, marginBottom: 4, color: D.text }}>Developer <em style={{ color: accent }}>Panel</em></h1>
        <p style={{ fontSize: 13, color: D.textMuted, marginBottom: 24 }}>High level access only.</p>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <input type={showPassword ? 'text' : 'password'} placeholder="Enter dev password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
            style={{ ...inputStyle, paddingRight: 44 }} />
          <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: D.textMuted }}>{showPassword ? '🙈' : '👁️'}</button>
        </div>
        {error && <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={login} style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Login →</button>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: D.bg, minHeight: '100vh', ['--accent' as string]: accent } as React.CSSProperties}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${ALL_FONTS_IMPORT}&display=swap');`}</style>
      <nav style={{ background: D.panel, borderBottom: `1px solid ${D.border}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: D.text }}>Developer <em style={{ color: accent }}>Panel</em></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.location.href = '/admin'} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, color: D.text }}>→ Client Admin</button>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, color: D.text }}>← View Store</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: D.panel, borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', marginBottom: 20, border: `1px solid ${D.border}` }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, marginBottom: 6, color: D.text }}>Store Settings</h2>
          <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 28 }}>Design controls. Delete this page after handoff to lock the design permanently.</p>

          <Section title="Store Identity">
            <Row label="Store Name" hint="This becomes the browser tab title"><input value={settingsForm.store_name} onChange={e => sf('store_name', e.target.value)} style={inputStyle} /></Row>
            <Row label="Favicon" hint="The small icon shown in the browser tab. Use a square image — PNG, SVG, or ICO. Recommended: 64×64px or 512×512px.">
              <input type="file" accept="image/*,.ico" onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return
                const ext = f.name.split('.').pop()
                const name = `favicon-${Date.now()}.${ext}`
                const { error } = await supabase.storage.from('product-images').upload(name, f)
                if (!error) { const { data: ud } = supabase.storage.from('product-images').getPublicUrl(name); sf('favicon_url', ud.publicUrl) }
              }} style={{ ...inputStyle, marginBottom: 6 }} />
              {settingsForm.favicon_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <img src={settingsForm.favicon_url} alt="Favicon" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4, background: '#fff', padding: 2, border: `1px solid ${D.border}` }} />
                  <span style={{ fontSize: 11, color: D.textMuted }}>Shows in browser tab</span>
                  <button onClick={() => sf('favicon_url', '')} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#ff6b6b' }}>Remove</button>
                </div>
              )}
            </Row>
            <Row label="Logo Image">
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; setLogoFile(f); setLogoPreview(URL.createObjectURL(f)) }} style={{ ...inputStyle, marginBottom: 6 }} />
              {logoPreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={logoPreview} alt="Logo" style={{ height: 36, objectFit: 'contain', borderRadius: 4, background: '#fff', padding: 4 }} />
                  <button onClick={async () => { setLogoFile(null); setLogoPreview(''); await supabase.from('settings').update({ logo_url: '' }).eq('id', settingsId); fetchSettings() }} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#ff6b6b' }}>Remove</button>
                </div>
              )}
            </Row>
          </Section>

          <Section title="Colors">
            <SubSection title="Brand">
              <Row label="Accent Color — buttons, prices, badges">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={settingsForm.accent_color} onChange={e => sf('accent_color', e.target.value)} style={{ width: 44, height: 36, borderRadius: 8, border: `1px solid ${D.inputBorder}`, cursor: 'pointer', padding: 2, background: 'transparent' }} />
                  <input value={settingsForm.accent_color} onChange={e => sf('accent_color', e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 1 }} />
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: settingsForm.accent_color, flexShrink: 0, border: `1px solid ${D.border}` }} />
                </div>
              </Row>
            </SubSection>
            <SubSection title="Backgrounds">
              <ColorRow label="Page Background" value={theme.bg_page} onChange={v => setT('bg_page', v)} />
              <ColorRow label="Card Background" value={theme.bg_card} onChange={v => setT('bg_card', v)} />
              <ColorRow label="Nav Background" value={theme.bg_nav} onChange={v => setT('bg_nav', v)} hint="Supports rgba() for blur/transparency" />
              <ColorRow label="Footer Background" value={theme.bg_footer} onChange={v => setT('bg_footer', v)} />
            </SubSection>
            <SubSection title="Text">
              <ColorRow label="Primary Text" value={theme.text_primary} onChange={v => setT('text_primary', v)} />
              <ColorRow label="Secondary Text" value={theme.text_secondary} onChange={v => setT('text_secondary', v)} />
              <ColorRow label="Price Color" value={theme.text_price} onChange={v => setT('text_price', v)} hint="Leave empty to use accent color" />
              <ColorRow label="Nav Text" value={theme.text_nav} onChange={v => setT('text_nav', v)} />
              <ColorRow label="Search Bar Text Color" value={theme.text_search || theme.text_primary} onChange={v => setT('text_search', v)} hint="Color of text typed into the search bar" />
            </SubSection>
            <SubSection title="Badges">
              <ColorRow label="Badge Background" value={theme.badge_bg} onChange={v => setT('badge_bg', v)} hint="Leave empty to use accent color" />
              <ColorRow label="Badge Text" value={theme.badge_text} onChange={v => setT('badge_text', v)} />
            </SubSection>
            <SubSection title="Borders">
              <ColorRow label="Card Border Color" value={theme.border_card_color} onChange={v => setT('border_card_color', v)} />
              <SliderRow label="Card Border Width" value={theme.border_card_width} min={0} max={4} onChange={v => setT('border_card_width', v)} hint="0 = no border" />
              <ColorRow label="Nav Border Color" value={theme.border_nav_color} onChange={v => setT('border_nav_color', v)} />
            </SubSection>
          </Section>

          <Section title="Announcement Bar">
            <ColorRow label="Background Color" value={theme.announcement_bg || '#1A1714'} onChange={v => setT('announcement_bg', v)} />
            <ColorRow label="Text Color" value={theme.announcement_text || '#F5F2EE'} onChange={v => setT('announcement_text', v)} />
          </Section>

          <Section title="Footer">
            <ColorRow label="Footer Background" value={theme.footer_bg || theme.bg_footer} onChange={v => setT('footer_bg', v)} />
            <ColorRow label="Footer Text Color" value={theme.footer_text || theme.text_secondary} onChange={v => setT('footer_text', v)} />
            <ToggleRow label={theme.footer_show_powered_by !== false ? '✓ Show "Powered by Stripe" text' : '✗ Hide "Powered by Stripe" text'} value={theme.footer_show_powered_by !== false} onChange={v => setT('footer_show_powered_by', v)} />
          </Section>

          <Section title="Scroll Animations">
            <ChipRow label="Scroll Effect" value={settingsForm.scroll_effect} onChange={v => sf('scroll_effect', v)} options={[
              { value: 'none', label: '✕ None' },
              { value: 'fade_up', label: '↑ Fade Up' },
              { value: 'fade_in', label: '○ Fade In' },
              { value: 'zoom_in', label: '⊕ Zoom In' },
              { value: 'slide_in', label: '→ Slide In' },
              { value: 'stagger', label: '⠿ Stagger' },
            ]} hint="Fade Up: cards float up as they appear. Zoom In: cards grow into view. Slide In: cards enter from the left. Stagger: cards appear one by one in sequence." />
            {settingsForm.scroll_effect !== 'none' && (
              <ChipRow label="Animation Behavior" value={settingsForm.scroll_behavior || 'once'} onChange={v => sf('scroll_behavior', v)} options={[
                { value: 'once', label: '① Once only' },
                { value: 'filter', label: '⟳ On filter/sort change' },
                { value: 'always', label: '∞ Always on scroll' },
              ]} hint="Once: animates on first load only. On change: re-animates when you switch categories or sort. Always: re-animates every time a card enters the viewport." />
            )}
          </Section>

          <Section title="Image Banner Carousel">
            <ToggleRow label={settingsForm.banner_active ? '✓ Banner visible on homepage' : '✗ Banner hidden'} value={settingsForm.banner_active} onChange={v => sf('banner_active', v)} />
            {settingsForm.banner_active && (
              <>
                <ChipRow label="Banner Position" value={settingsForm.banner_position} onChange={v => sf('banner_position', v)} options={[
                  { value: 'above_hero', label: '↑ Above Hero' },
                  { value: 'below_hero', label: '↓ Below Hero' },
                  { value: 'above_products', label: '↑ Above Products' },
                  { value: 'below_products', label: '↓ Below Products' },
                ]} hint="Where the banner appears on the homepage" />
                <ChipRow label="Banner Height" value={settingsForm.banner_ratio} onChange={v => sf('banner_ratio', v)} options={[
                  { value: '16/3', label: 'Slim' },
                  { value: '16/5', label: 'Flat' },
                  { value: '16/7', label: 'Medium' },
                  { value: '16/9', label: 'Tall (16:9)' },
                  { value: '1/1', label: 'Square' },
                ]} hint="Controls how tall the banner is" />
                <SliderRow label="Seconds per slide" value={settingsForm.banner_interval} min={2} max={8} unit="s" onChange={v => sf('banner_interval', v)} hint="How long each image shows before auto-advancing" />
                <ChipRow label="Slide Transition" value={settingsForm.banner_transition || 'fade'} onChange={v => sf('banner_transition', v)} options={[
                  { value: 'fade', label: '○ Fade' },
                  { value: 'slide', label: '→ Slide' },
                  { value: 'zoom', label: '⊕ Zoom' },
                  { value: 'flip', label: '↻ Flip' },
                ]} hint="How images transition between each other" />
                <Row label={`Banner Images (${bannerImages.length}/5)`} hint="Upload up to 5 images. Each image can have an optional click-through link.">
                  {bannerImages.length < 5 && (
                    <div style={{ marginBottom: 12 }}>
                      <input type="file" accept="image/*" disabled={bannerUploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadBannerImage(f) }}
                        style={{ ...inputStyle }} />
                      {bannerUploading && <p style={{ fontSize: 12, color: D.textMuted, marginTop: 4 }}>Uploading...</p>}
                    </div>
                  )}
                  {bannerImages.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {bannerImages.map((item, i) => (
                        <div key={i} style={{ background: D.card, borderRadius: 10, padding: 10, border: `1px solid ${D.border}` }}>
                          <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                            <img src={item.url} alt={`Banner ${i + 1}`} style={{ width: '100%', aspectRatio: '16/5', objectFit: 'cover', display: 'block' }} />
                            <button onClick={() => setBannerImages(prev => prev.filter((_, idx) => idx !== i))}
                              style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                            <span style={{ position: 'absolute', bottom: 4, left: 6, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 4 }}>#{i + 1}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: D.textMuted, flexShrink: 0 }}>Link (optional):</span>
                            <input
                              value={item.link || ''}
                              onChange={e => setBannerImages(prev => prev.map((b, idx) => idx === i ? { ...b, link: e.target.value } : b))}
                              placeholder="https://... or /product/123"
                              style={{ flex: 1, padding: '5px 8px', borderRadius: 5, border: `1px solid ${D.inputBorder}`, fontSize: 11, background: D.input, color: D.text }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Row>
              </>
            )}
          </Section>

          <Section title="Nav Buttons">
            <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 16 }}>Choose which buttons appear in the nav bar and what they're called. On mobile they collapse into a hamburger menu.</p>

            <SubSection title="Contact Button">
              <ToggleRow label={settingsForm.show_contact_feature ? (settingsForm.show_contact_nav ? '✓ Contact button visible in nav' : '✗ Contact button hidden from nav') : '✗ Contact feature disabled'} value={settingsForm.show_contact_feature && settingsForm.show_contact_nav} onChange={v => { sf('show_contact_feature', v); sf('show_contact_nav', v) }} />
              {settingsForm.show_contact_feature && settingsForm.show_contact_nav && (
                <Row label="Button Label"><input value={settingsForm.nav_contact_label} onChange={e => sf('nav_contact_label', e.target.value)} placeholder="Contact" style={inputStyle} /></Row>
              )}
              {settingsForm.show_contact_feature && (
                <>
                  <ToggleRow label={settingsForm.show_email_signup ? '✓ Show email signup in footer' : '✗ Hide email signup in footer'} value={settingsForm.show_email_signup} onChange={v => sf('show_email_signup', v)} />
                  <ToggleRow label={settingsForm.contact_notification_sound ? '✓ Play sound for new messages in admin' : '✗ No sound for new messages'} value={settingsForm.contact_notification_sound} onChange={v => sf('contact_notification_sound', v)} />
                </>
              )}
              <ToggleRow label={settingsForm.show_contact_feature ? '✓ Contact feature enabled (contact page, nav link, footer)' : '✗ Contact feature fully disabled'} value={settingsForm.show_contact_feature} onChange={v => sf('show_contact_feature', v)} />
              <div style={{ padding: '10px 12px', background: D.card, borderRadius: 8, border: `1px solid ${D.border}`, marginTop: 4 }}>
                <p style={{ fontSize: 12, color: D.textMuted, margin: 0 }}>📋 Contact details (phone, email, WhatsApp) are managed in the Admin page.</p>
              </div>
            </SubSection>

            <SubSection title="Policies Button">
              <ToggleRow label={settingsForm.show_nav_policy ? '✓ Policies button visible in nav' : '✗ Policies button hidden from nav'} value={settingsForm.show_nav_policy} onChange={v => sf('show_nav_policy', v)} />
              {settingsForm.show_nav_policy && (
                <Row label="Button Label"><input value={settingsForm.nav_policy_label} onChange={e => sf('nav_policy_label', e.target.value)} placeholder="Policies" style={inputStyle} /></Row>
              )}
            </SubSection>

            <SubSection title="Custom Button">
              <ToggleRow label={settingsForm.custom_page_enabled ? '✓ Custom button visible in nav' : '✗ Custom button hidden'} value={settingsForm.custom_page_enabled} onChange={v => sf('custom_page_enabled', v)} />
              {settingsForm.custom_page_enabled && (
                <>
                  <Row label="Button Label"><input value={settingsForm.custom_page_label} onChange={e => sf('custom_page_label', e.target.value)} placeholder="More Info" style={inputStyle} /></Row>
                  <Row label="Page Image (optional)">
                    <input type="file" accept="image/*" disabled={customImageUploading}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadCustomImage(f) }}
                      style={{ ...inputStyle, marginBottom: 6 }} />
                    {customImageUploading && <p style={{ fontSize: 12, color: D.textMuted, marginTop: 4 }}>Uploading...</p>}
                    {settingsForm.custom_page_image_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                        <img src={settingsForm.custom_page_image_url} alt="Custom" style={{ height: 60, objectFit: 'cover', borderRadius: 6, width: 120 }} />
                        <button onClick={() => sf('custom_page_image_url', '')} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#ff6b6b' }}>Remove</button>
                      </div>
                    )}
                  </Row>
                  <Row label="Page Content">
                    <textarea value={settingsForm.custom_page_content} onChange={e => sf('custom_page_content', e.target.value)}
                      rows={6} placeholder="Write anything here — announcements, about us, FAQs..."
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                  </Row>
                  <ToggleRow label={settingsForm.custom_page_markdown ? '✓ Format as Markdown (bold, bullets, headings)' : '✗ Plain text only'} value={settingsForm.custom_page_markdown} onChange={v => sf('custom_page_markdown', v)} />
                </>
              )}
            </SubSection>
          </Section>

          <Section title="Typography">
            <Row label="Heading Font">
              <select value={theme.font_heading} onChange={e => setT('font_heading', e.target.value)} style={{ ...inputStyle, fontSize: 13 }}>
                {HEADING_FONTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div style={{ marginTop: 8, padding: '12px 16px', background: D.card, borderRadius: 8, border: `1px solid ${D.border}`, fontFamily: theme.font_heading, fontSize: 22, fontWeight: theme.font_weight_heading, color: D.text }}>
                The quick brown fox jumps
              </div>
            </Row>
            <ChipRow label="Heading Effect" value={theme.heading_effect || 'none'} onChange={v => setT('heading_effect', v)} options={[
              { value: 'none', label: 'None' }, { value: 'metallic_silver', label: '⬜ Silver' },
              { value: 'metallic_gold', label: '🟨 Gold' }, { value: 'rustic', label: '🟫 Rustic' },
              { value: 'embossed', label: '◻ Embossed' }, { value: 'neon', label: '💡 Neon' },
            ]} />
            <Row label="Body Font">
              <select value={theme.font_body} onChange={e => setT('font_body', e.target.value)} style={{ ...inputStyle, fontSize: 13 }}>
                {BODY_FONTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div style={{ marginTop: 8, padding: '10px 16px', background: D.card, borderRadius: 8, border: `1px solid ${D.border}`, fontFamily: theme.font_body, fontSize: 14, color: D.textMuted }}>
                This is how body text will look across the store.
              </div>
            </Row>
            <SliderRow label="Base Font Size" value={theme.font_size_base} min={11} max={18} onChange={v => setT('font_size_base', v)} />
            <SliderRow label="Price Font Size" value={theme.font_size_price} min={14} max={28} onChange={v => setT('font_size_price', v)} />
            <SliderRow label="Heading Weight" value={theme.font_weight_heading} min={400} max={900} step={100} unit="" onChange={v => setT('font_weight_heading', v)} hint="400=normal  600=semibold  700=bold  900=black" />
            <SliderRow label="Button Weight" value={theme.font_weight_btn} min={400} max={900} step={100} unit="" onChange={v => setT('font_weight_btn', v)} />
          </Section>

          <Section title="Shapes & Radius">
            <SliderRow label="Card Corner Radius" value={theme.radius_card} min={0} max={32} onChange={v => setT('radius_card', v)} />
            <SliderRow label="Button Corner Radius" value={theme.radius_btn} min={0} max={100} onChange={v => setT('radius_btn', v)} hint="0 = square  100 = pill" />
            <SliderRow label="Input Corner Radius" value={theme.radius_input} min={0} max={24} onChange={v => setT('radius_input', v)} />
            <SliderRow label="Image Corner Radius" value={theme.radius_image} min={0} max={24} onChange={v => setT('radius_image', v)} />
          </Section>

          <Section title="Buttons">
            <ChipRow label="Button Style" value={theme.btn_style} onChange={v => setT('btn_style', v as any)} options={[{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'soft', label: 'Soft' }]} />
            <ChipRow label="Button Size" value={theme.btn_size} onChange={v => setT('btn_size', v as any)} options={[{ value: 'compact', label: 'Compact' }, { value: 'normal', label: 'Normal' }, { value: 'large', label: 'Large' }]} />
          </Section>

          <Section title="Cards">
            <ChipRow label="Card Shadow" value={theme.card_shadow} onChange={v => setT('card_shadow', v as any)} options={[{ value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'medium', label: 'Medium' }, { value: 'strong', label: 'Strong' }]} />
            <ChipRow label="Card Hover Effect" value={theme.card_hover} onChange={v => setT('card_hover', v as any)} options={[{ value: 'lift', label: '↑ Lift' }, { value: 'glow', label: '✦ Glow' }, { value: 'scale', label: '⊕ Scale' }, { value: 'none', label: 'None' }]} />
            <SliderRow label="Card Padding" value={theme.card_padding} min={8} max={28} onChange={v => setT('card_padding', v)} />
            <ChipRow label="Card Text Alignment" value={theme.card_text_align || 'left'} onChange={v => setT('card_text_align', v as any)} options={[{ value: 'left', label: '⬛ Left' }, { value: 'center', label: '⬜ Center' }]} />
            <ChipRow label="Product Image Shape" value={theme.card_image_ratio || 'square'} onChange={v => setT('card_image_ratio', v as any)} options={[
              { value: 'square', label: '⬛ Square (1:1)' },
              { value: 'portrait', label: '▮ Portrait (4:5)' },
              { value: 'landscape', label: '▬ Landscape (4:3)' },
            ]} hint="Portrait works great for clothing. Landscape for food or travel." />
          </Section>

          <Section title="Layout">
            <SliderRow label="Page Max Width" value={theme.page_max_width} min={600} max={1600} step={20} onChange={v => setT('page_max_width', v)} hint="Increase to fill wider screens" />
            <SliderRow label="Product Grid Gap" value={theme.grid_gap} min={4} max={40} onChange={v => setT('grid_gap', v)} />
            <SliderRow label="Section Gap" value={theme.section_gap} min={8} max={60} onChange={v => setT('section_gap', v)} />
            <Row label="Products Per Row (desktop)" hint="Auto fills based on screen size. Fixed numbers lock columns.">
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ n: 0, label: 'Auto' }, { n: 2, label: '2' }, { n: 3, label: '3' }, { n: 4, label: '4' }, { n: 5, label: '5' }, { n: 6, label: '6' }].map(({ n, label }) => (
                  <button key={n} onClick={() => setT('grid_columns', n)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${theme.grid_columns === n ? 'var(--accent)' : D.inputBorder}`, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: theme.grid_columns === n ? 'var(--accent)' : D.input, color: theme.grid_columns === n ? '#fff' : D.text, transition: 'all 0.15s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          <Section title="Navigation">
            <ToggleRow label={theme.nav_sticky ? '✓ Sticky nav (stays at top while scrolling)' : '✗ Static nav (scrolls away)'} value={theme.nav_sticky} onChange={v => setT('nav_sticky', v)} />
            <SliderRow label="Nav Height" value={theme.nav_height} min={44} max={100} onChange={v => setT('nav_height', v)} />
            <SliderRow label="Logo Height in Nav" value={theme.nav_logo_height || 36} min={20} max={70} onChange={v => setT('nav_logo_height', v)} hint="Controls how tall the logo image appears in the nav bar" />
          </Section>

          <Section title="Category Filter Style">
            <ChipRow label="Filter Style" value={theme.category_style || 'pills'} onChange={v => setT('category_style', v as any)} options={[
              { value: 'pills', label: '💊 Pills' }, { value: 'underline', label: '― Underline' },
              { value: 'dropdown', label: '▾ Dropdown' }, { value: 'hidden', label: '✕ Hidden' },
            ]} hint="Underline shows a bar with a bold underline on the active category" />
          </Section>

          <Section title="Hero Section">
            <ToggleRow label={settingsForm.hero_visible ? '✓ Hero visible on storefront' : '✗ Hero hidden from storefront'} value={settingsForm.hero_visible} onChange={v => sf('hero_visible', v)} />
            {settingsForm.hero_visible && (
              <>
                <ChipRow label="Hero Background Style" value={theme.hero_style} onChange={v => setT('hero_style', v as any)} options={[
                  { value: 'gradient', label: 'Gradient' }, { value: 'solid', label: 'Solid' }, { value: 'minimal', label: 'Minimal' },
                  { value: 'image', label: '🖼 Photo' }, { value: 'stripes', label: '▧ Stripes' }, { value: 'dots', label: '··· Dots' },
                  { value: 'mesh', label: '✦ Mesh' }, { value: 'dark', label: '🌙 Dark' },
                ]} />
                {theme.hero_style === 'image' && (
                  <Row label="Hero Background Photo">
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; setHeroBgFile(f); setHeroBgPreview(URL.createObjectURL(f)) }} style={{ ...inputStyle, marginBottom: 6 }} />
                    {heroBgPreview && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                        <img src={heroBgPreview} alt="Hero bg" style={{ height: 60, objectFit: 'cover', borderRadius: 6, width: 120 }} />
                        <button onClick={() => { setHeroBgFile(null); setHeroBgPreview(''); setT('hero_bg_image_url', '') }} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#ff6b6b' }}>Remove</button>
                      </div>
                    )}
                    <SliderRow label="Photo Overlay Darkness" value={theme.hero_bg_overlay ?? 40} min={0} max={80} unit="%" onChange={v => setT('hero_bg_overlay', v)} hint="Darkens the photo so text is readable" />
                  </Row>
                )}
                <ChipRow label="Hero Text Alignment" value={theme.hero_text_align || 'left'} onChange={v => setT('hero_text_align', v as any)} options={[{ value: 'left', label: '⬛ Left' }, { value: 'center', label: '⬜ Center' }]} hint="On mobile, text is always centered" />
                <ToggleRow label={theme.hero_show_badge ? '✓ Show "Trusted Seller" badge' : '✗ Hide badge'} value={theme.hero_show_badge} onChange={v => setT('hero_show_badge', v)} />
                <SliderRow label="Hero Vertical Padding" value={theme.hero_padding} min={12} max={80} onChange={v => setT('hero_padding', v)} />
                <Row label="Hero Headline"><input value={settingsForm.hero_headline} onChange={e => sf('hero_headline', e.target.value)} style={inputStyle} /></Row>
                <Row label="Hero Subtext"><input value={settingsForm.hero_subtext} onChange={e => sf('hero_subtext', e.target.value)} style={inputStyle} /></Row>
                <Row label="Hero Emoji (optional)"><input value={settingsForm.hero_emoji} onChange={e => sf('hero_emoji', e.target.value)} maxLength={4} style={inputStyle} /></Row>
                <Row label="Hero Side Image (desktop only)">
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; setHeroImageFile(f); setHeroImagePreview(URL.createObjectURL(f)) }} style={{ ...inputStyle, marginBottom: 6 }} />
                  {heroImagePreview && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={heroImagePreview} alt="Hero" style={{ height: 52, objectFit: 'contain', borderRadius: 4, background: 'rgba(255,255,255,0.1)', padding: 4 }} />
                      <button onClick={async () => { await supabase.from('settings').update({ hero_image_url: '' }).eq('id', settingsId); setHeroImageFile(null); setHeroImagePreview(''); fetchSettings() }} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#ff6b6b' }}>Remove</button>
                    </div>
                  )}
                </Row>
              </>
            )}
          </Section>

          <Section title="Media Panel">
            <ToggleRow label={settingsForm.media_active ? '✓ Media panel visible' : '✗ Media panel hidden'} value={settingsForm.media_active} onChange={v => sf('media_active', v)} />
            <SelectRow label="Media Type" value={settingsForm.media_type} onChange={v => sf('media_type', v)} options={[{ value: 'image', label: 'Image' }, { value: 'video_upload', label: 'Upload Video' }, { value: 'video_youtube', label: 'YouTube / Vimeo URL' }]} />
            {settingsForm.media_type === 'image' && (
              <>
                <Row label="Image URL"><input value={settingsForm.media_url} onChange={e => sf('media_url', e.target.value)} placeholder="https://..." style={inputStyle} /></Row>
                <Row label="Or upload">
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = async () => { const ext = f.name.split('.').pop(); const name = `media-${Date.now()}.${ext}`; const { error } = await supabase.storage.from('product-images').upload(name, f); if (!error) { const { data: ud } = supabase.storage.from('product-images').getPublicUrl(name); sf('media_url', ud.publicUrl) } }; reader.readAsDataURL(f) }} style={inputStyle} />
                </Row>
              </>
            )}
            {settingsForm.media_type === 'video_upload' && (
              <>
                <Row label="Upload Video"><input type="file" accept="video/*" onChange={e => { const f = e.target.files?.[0]; if (f) setVideoFile(f) }} style={inputStyle} /></Row>
                <ToggleRow label="Show play button overlay" value={settingsForm.media_overlay} onChange={v => sf('media_overlay', v)} />
                {settingsForm.media_overlay && (
                  <Row label="Overlay Thumbnail">
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)) }} style={inputStyle} />
                    {thumbnailPreview && <img src={thumbnailPreview} alt="Thumb" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginTop: 6 }} />}
                  </Row>
                )}
              </>
            )}
            {settingsForm.media_type === 'video_youtube' && (
              <Row label="YouTube / Vimeo URL"><input value={settingsForm.media_url} onChange={e => sf('media_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} /></Row>
            )}
          </Section>

          <Section title="Product Page">
            <ToggleRow label={settingsForm.show_similar_products ? '✓ Show similar products' : '✗ Hide similar products'} value={settingsForm.show_similar_products} onChange={v => sf('show_similar_products', v)} />
            <ChipRow label="Image Gallery Transition" value={(settingsForm as any).product_transition || 'fade'} onChange={v => sf('product_transition', v)} options={[
              { value: 'fade', label: '○ Fade' },
              { value: 'slide', label: '→ Slide' },
              { value: 'zoom', label: '⊕ Zoom' },
              { value: 'flip', label: '↻ Flip' },
            ]} hint="How product images transition when clicking thumbnails or swiping" />
          </Section>

          <Section title="Sort Options">
            <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 12 }}>Drag to reorder · rename · toggle visibility</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {sortOptions.map((opt, i) => (
                <div key={opt.value} draggable onDragStart={() => handleDragStart(i)} onDragOver={e => handleDragOver(e, i)} onDragEnd={handleDragEnd}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: dragIndex === i ? D.card : D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 8, padding: '8px 12px', cursor: 'grab' }}>
                  <span style={{ color: D.textMuted, fontSize: 14, flexShrink: 0 }}>⠿</span>
                  <input type="checkbox" checked={opt.enabled} onChange={() => toggleSortEnabled(i)} style={{ flexShrink: 0, accentColor: accent }} />
                  <input value={opt.label} onChange={e => updateSortLabel(i, e.target.value)} style={{ flex: 1, padding: '5px 8px', borderRadius: 5, border: `1px solid ${D.inputBorder}`, fontSize: 12, color: opt.enabled ? D.text : D.textMuted, background: opt.enabled ? D.card : D.bg }} />
                  <span style={{ fontSize: 10, color: D.textMuted, background: D.bg, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', flexShrink: 0 }}>{opt.value}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: D.textMuted, marginBottom: 0 }}>First enabled option is the default sort.</p>
          </Section>

          <button onClick={saveSettings} disabled={loading} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '14px 24px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, opacity: loading ? 0.7 : 1, width: '100%', boxShadow: `0 4px 16px ${accent}66` }}>
            {loading ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}