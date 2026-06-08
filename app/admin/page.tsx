'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

interface Product {
  id: string; name: string; description: string; price: number
  sale_price: number | null; sale_badge_type: string | null
  category: string; image_url: string; images: string[]
  sold: boolean; stock: number; has_variants: boolean; sort_order: number
}
interface Policy { id: string; title: string; content: string; order: number }
interface Variant { id?: string; label: string; stock: number; price_override: string; image_url: string; order: number }
interface ContactSubmission { id: string; name: string; email: string; phone: string | null; message: string; created_at: string; read: boolean }

const DARK = {
  bg: '#1e1e2e', panel: '#2a2a3e', card: '#32324a', border: '#44445a',
  text: '#e8e8f0', textMuted: '#9999bb', input: '#3a3a52', inputBorder: '#55556a', label: '#c0c0d8',
  success: '#1a3a1a', successBorder: '#2d6b2d', successText: '#88dd88',
  error: '#3a1a1a', errorBorder: '#6b2d2d', errorText: '#dd8888',
  editBtn: '#1a2a3a', editBtnText: '#6ab0f5', editBtnBorder: '#2a4a6a',
  variantBadge: '#1a2a3a', variantBadgeText: '#6ab0f5', variantBadgeBorder: '#2a4a6a',
}
const LIGHT = {
  bg: '#F5F2EE', panel: '#ffffff', card: '#f8f6f3', border: '#e5e5e5',
  text: '#1A1714', textMuted: '#666666', input: '#ffffff', inputBorder: '#dddddd', label: '#444444',
  success: '#EAF3DE', successBorder: '#b3d98a', successText: '#3B6D11',
  error: '#FDECEA', errorBorder: '#f5b7b1', errorText: '#C0392B',
  editBtn: '#E6F1FB', editBtnText: '#185FA5', editBtnBorder: '#b8d4ef',
  variantBadge: '#E6F1FB', variantBadgeText: '#185FA5', variantBadgeBorder: '#b8d4ef',
}

function MarkdownToolbar({ textareaId, value, onChange, C }: { textareaId: string; value: string; onChange: (v: string) => void; C: typeof DARK }) {
  function wrap(before: string, after: string, placeholder: string) {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null; if (!el) return
    const start = el.selectionStart; const end = el.selectionEnd
    const selected = value.substring(start, end) || placeholder
    onChange(value.substring(0, start) + before + selected + after + value.substring(end))
    setTimeout(() => { el.focus(); el.setSelectionRange(start + before.length, start + before.length + selected.length) }, 0)
  }
  function insertLine(prefix: string, placeholder: string) {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null; if (!el) return
    const start = el.selectionStart; const lineStart = value.lastIndexOf('\n', start - 1) + 1
    onChange(value.substring(0, lineStart) + prefix + value.substring(lineStart))
    setTimeout(() => { el.focus(); el.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length + placeholder.length) }, 0)
  }
  const btn = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 9px', fontSize: 12, cursor: 'pointer', color: C.text, fontWeight: 600, lineHeight: 1.4 }
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
      <button type="button" style={{ ...btn, fontWeight: 700 }} onClick={() => wrap('**', '**', 'bold text')}>B</button>
      <button type="button" style={{ ...btn, fontStyle: 'italic' }} onClick={() => wrap('*', '*', 'italic text')}>I</button>
      <button type="button" style={btn} onClick={() => insertLine('- ', 'list item')}>• List</button>
      <button type="button" style={btn} onClick={() => insertLine('1. ', 'list item')}>1. List</button>
      <button type="button" style={btn} onClick={() => insertLine('## ', 'Heading')}>H2</button>
      <button type="button" style={btn} onClick={() => insertLine('### ', 'Heading')}>H3</button>
      <span style={{ fontSize: 11, color: C.textMuted, alignSelf: 'center', marginLeft: 4 }}>Markdown</span>
    </div>
  )
}

function SaleBadgeSelector({ value, onChange, accent, C }: { value: string; onChange: (v: string) => void; accent: string; C: typeof DARK }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      {[{ value: 'percent_off', label: '% Off' }, { value: 'dollars_off', label: '$ Off' }, { value: 'save_dollars', label: 'Save $X' }].map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          style={{ padding: '6px 14px', borderRadius: 100, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: value === opt.value ? accent : C.card, color: value === opt.value ? '#fff' : C.text }}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Panel({ children, style, C, isDark }: { children: React.ReactNode; style?: React.CSSProperties; C: typeof DARK; isDark: boolean }) {
  return <div style={{ background: C.panel, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20, ...style }}>{children}</div>
}
function SectionTitle({ children, C }: { children: React.ReactNode; C: typeof DARK }) {
  return <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, marginBottom: 16, color: C.text, fontWeight: 700 }}>{children}</h2>
}
function Label({ children, C }: { children: React.ReactNode; C: typeof DARK }) {
  return <label style={{ fontSize: 12, color: C.label, display: 'block', marginBottom: 5, fontWeight: 600, letterSpacing: 0.2 }}>{children}</label>
}

// Notification sound — short pleasant ping using Web Audio API
function playPing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(true)
  const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState('')
  const [products, setProducts] = useState<Product[]>([]); const [loading, setLoading] = useState(false); const [success, setSuccess] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [announcement, setAnnouncement] = useState<{ id: string; message: string; active: boolean } | null>(null)
  const [announcementText, setAnnouncementText] = useState('')
  const [adminSearch, setAdminSearch] = useState(''); const [adminFilter, setAdminFilter] = useState('All')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', sale_price: '', sale_badge_type: 'percent_off', category: 'General', sold: false, stock: 0, has_variants: false })
  const [editImages, setEditImages] = useState<string[]>([]); const [editNewFiles, setEditNewFiles] = useState<File[]>([]); const [editNewPreviews, setEditNewPreviews] = useState<string[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([]); const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', description: '', price: '', sale_price: '', sale_badge_type: 'percent_off', category: '', sold: false, stock: 0, has_variants: false })
  const [policies, setPolicies] = useState<Policy[]>([]); const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null); const [policyForm, setPolicyForm] = useState({ title: '', content: '' })
  const [editVariants, setEditVariants] = useState<Variant[]>([]); const [variantsLoading, setVariantsLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Contact
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([])
  const [showContactSubmissions, setShowContactSubmissions] = useState(false)
  const [emailSubscribers, setEmailSubscribers] = useState<{ id: string; email: string; created_at: string }[]>([])
  const [showContactFeature, setShowContactFeature] = useState(true)
  const [notificationSound, setNotificationSound] = useState(true)
  const prevUnreadCount = useRef(0)

  // Contact info editable from admin
  const [contactInfo, setContactInfo] = useState({ headline: '', intro: '', phone: '', email: '', whatsapp_url: '', extra: '' })
  const [contactInfoSaving, setContactInfoSaving] = useState(false)
  const [settingsId, setSettingsId] = useState('')

  // Reorder
  const [reorderMode, setReorderMode] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const reorderListRef = useRef<Product[]>([])
  const draggingRef = useRef<number | null>(null)
  const insertRef = useRef<number | null>(null)
  const mouseYRef = useRef(0)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const lineRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const [renderTick, setRenderTick] = useState(0)

  const C = isDark ? DARK : LIGHT
  const accent = accentColor || '#C0392B'

  useEffect(() => { const s = localStorage.getItem('adminMode'); if (s === 'light') setIsDark(false) }, [])
  function toggleMode() { const n = !isDark; setIsDark(n); localStorage.setItem('adminMode', n ? 'dark' : 'light') }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.inputBorder}`, fontSize: 13, background: C.input, color: C.text, boxSizing: 'border-box' as const }

  const globalStyles = `
    :root { --accent: ${accent}; }
    * { box-sizing: border-box; }
    body { background: ${C.bg}; color: ${C.text}; }
    @media (max-width: 767px) {
      .admin-grid { grid-template-columns: 1fr !important; }
      .admin-outer { padding: 16px 12px !important; }
      .admin-nav { padding: 0 16px !important; }
      .product-row-buttons { flex-direction: row; flex-wrap: wrap; gap: 6px !important; }
      .edit-image-grid { grid-template-columns: repeat(3, 1fr) !important; }
      .mobile-top-sections { display: block !important; }
      .desktop-bottom-sections { display: none !important; }
    }
    @media (min-width: 768px) {
      .mobile-top-sections { display: none !important; }
      .desktop-bottom-sections { display: block !important; }
    }
  `

  useEffect(() => { if (authed) { fetchProducts(); fetchCategories(); fetchAnnouncement(); fetchPolicies(); fetchContactSubmissions(); fetchEmailSubscribers(); fetchSiteSettings() } }, [authed])

  // Poll for new messages every 30 seconds
  useEffect(() => {
    if (!authed || !showContactFeature) return
    const interval = setInterval(async () => {
      const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false })
      const submissions = data || []
      const unread = submissions.filter(s => !s.read).length
      if (unread > prevUnreadCount.current && notificationSound) playPing()
      prevUnreadCount.current = unread
      setContactSubmissions(submissions)
    }, 30000)
    return () => clearInterval(interval)
  }, [authed, showContactFeature, notificationSound])

  useEffect(() => {
    const cached = localStorage.getItem('siteSettings')
    if (cached) { const p = JSON.parse(cached); if (p.accent_color) setAccentColor(p.accent_color) } else setAccentColor('#C0392B')
    supabase.from('settings').select('accent_color').single().then(({ data }) => {
      if (data?.accent_color) {
        setAccentColor(data.accent_color)
        const c = localStorage.getItem('siteSettings'); const ex = c ? JSON.parse(c) : {}
        localStorage.setItem('siteSettings', JSON.stringify({ ...ex, accent_color: data.accent_color }))
      }
    })
  }, [])

  async function fetchSiteSettings() {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) {
      setSettingsId(data.id)
      setShowContactFeature(data.show_contact_feature !== false)
      setNotificationSound(data.contact_notification_sound !== false)
      if (data.contact_info) setContactInfo({ ...{ headline: '', intro: '', phone: '', email: '', whatsapp_url: '', extra: '' }, ...data.contact_info })
    }
  }

  async function saveContactInfo() {
    if (!settingsId) return
    setContactInfoSaving(true)
    await supabase.from('settings').update({ contact_info: contactInfo }).eq('id', settingsId)
    setContactInfoSaving(false)
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    setProducts(data || [])
  }
  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true })
    const names = data?.map(c => c.name) || []
    setCategories(names)
    // Default the add-product form to the first category if none selected yet
    if (names.length > 0) setForm(f => f.category && names.includes(f.category) ? f : { ...f, category: names[0] })
  }
  async function fetchAnnouncement() { const { data } = await supabase.from('announcement').select('*').single(); if (data) { setAnnouncement(data); setAnnouncementText(data.message) } }
  async function fetchPolicies() { const { data } = await supabase.from('policies').select('*').order('order', { ascending: true }); setPolicies(data || []) }
  async function fetchContactSubmissions() {
    const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false })
    const submissions = data || []
    prevUnreadCount.current = submissions.filter(s => !s.read).length
    setContactSubmissions(submissions)
  }
  async function fetchEmailSubscribers() { const { data } = await supabase.from('email_subscribers').select('*').order('created_at', { ascending: false }); setEmailSubscribers(data || []) }

  async function markAllRead() {
    await supabase.from('contact_submissions').update({ read: true }).eq('read', false)
    setContactSubmissions(prev => prev.map(s => ({ ...s, read: true })))
    prevUnreadCount.current = 0
  }

  async function deleteSubmission(id: string) {
    if (!confirm('Delete this message?')) return
    await supabase.from('contact_submissions').delete().eq('id', id)
    setContactSubmissions(prev => prev.filter(s => s.id !== id))
  }

  // Open messages — mark all as read and play sound if new ones
  function openMessages() {
    const wasOpen = showContactSubmissions
    setShowContactSubmissions(!wasOpen)
    if (!wasOpen) {
      const unread = contactSubmissions.filter(s => !s.read).length
      if (unread > 0) { markAllRead(); if (notificationSound) playPing() }
    }
  }

  // Reorder logic
  function enterReorderMode() { reorderListRef.current = [...products]; setReorderMode(true); setAdminSearch(''); setAdminFilter('All') }
  function cancelReorder() { stopDrag(); setReorderMode(false) }
  function getInsertIndex(clientY: number): number {
    const rows = rowRefs.current
    for (let i = 0; i < rows.length; i++) { const el = rows[i]; if (!el) continue; const rect = el.getBoundingClientRect(); if (clientY < rect.top + rect.height / 2) return i }
    return rows.length
  }
  function updateLine(clientY: number) {
    if (!lineRef.current) return
    const ins = getInsertIndex(clientY); insertRef.current = ins
    const from = draggingRef.current; if (from === null) return
    const rows = rowRefs.current; const skip = ins === from || ins === from + 1
    if (skip) { lineRef.current.style.display = 'none'; return }
    let top: number | null = null
    if (ins >= rows.length) { const last = rows[rows.length - 1]; if (last) top = last.offsetTop + last.offsetHeight }
    else { const target = rows[ins]; if (target) top = target.offsetTop }
    if (top !== null) { lineRef.current.style.display = 'block'; lineRef.current.style.top = (top - 1) + 'px' }
  }
  function updateGhostAndLine(clientX: number, clientY: number) {
    if (ghostRef.current) { ghostRef.current.style.left = (clientX - 16) + 'px'; ghostRef.current.style.top = (clientY - 26) + 'px' }
    updateLine(clientY)
  }
  function stopDrag() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp)
    if (ghostRef.current) ghostRef.current.style.display = 'none'
    if (lineRef.current) lineRef.current.style.display = 'none'
    rowRefs.current.forEach(r => { if (r) r.style.opacity = '1' })
  }
  function onMouseDown(e: React.MouseEvent, i: number) {
    e.preventDefault(); draggingRef.current = i; insertRef.current = i; mouseYRef.current = e.clientY
    const row = rowRefs.current[i]; if (row) row.style.opacity = '0.25'
    const p = reorderListRef.current[i]
    if (ghostRef.current && p) {
      const img = ghostRef.current.querySelector('img') as HTMLImageElement | null
      const name = ghostRef.current.querySelector('p') as HTMLParagraphElement | null
      if (img) img.src = p.image_url || 'https://via.placeholder.com/60?text=No+Img'
      if (name) name.textContent = p.name
      ghostRef.current.style.display = 'flex'; ghostRef.current.style.left = (e.clientX - 16) + 'px'; ghostRef.current.style.top = (e.clientY - 26) + 'px'
    }
    window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp)
    let frameCount = 0
    function tick() {
      frameCount++
      const el = scrollRef.current
      if (el) {
        const rect = el.getBoundingClientRect(); const y = mouseYRef.current; const zone = 80; const maxSpeed = 5
        if (y - rect.top < zone && y - rect.top > 0) { const speed = Math.ceil(maxSpeed * (1 - (y - rect.top) / zone)); el.scrollTop = Math.max(0, el.scrollTop - speed) }
        else if (rect.bottom - y < zone && rect.bottom - y > 0) { const speed = Math.ceil(maxSpeed * (1 - (rect.bottom - y) / zone)); el.scrollTop = Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + speed) }
        if (frameCount % 3 === 0) updateLine(mouseYRef.current)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  function onMouseMove(e: MouseEvent) { mouseYRef.current = e.clientY; updateGhostAndLine(e.clientX, e.clientY) }
  function onMouseUp() {
    const from = draggingRef.current; const to = insertRef.current
    stopDrag(); draggingRef.current = null; insertRef.current = null
    if (from !== null && to !== null && to !== from && to !== from + 1) {
      const next = [...reorderListRef.current]; const [moved] = next.splice(from, 1); const target = to > from ? to - 1 : to; next.splice(target, 0, moved); reorderListRef.current = next
    }
    setRenderTick(t => t + 1)
  }
  async function saveOrder() {
    setSavingOrder(true); const list = reorderListRef.current
    for (let i = 0; i < list.length; i++) await supabase.from('products').update({ sort_order: i }).eq('id', list[i].id)
    setSavingOrder(false); setReorderMode(false); fetchProducts()
  }

  async function saveAnnouncement() {
    if (announcement) await supabase.from('announcement').update({ message: announcementText, active: announcement.active }).eq('id', announcement.id)
    else await supabase.from('announcement').insert([{ message: announcementText, active: true }])
    fetchAnnouncement()
  }
  async function toggleAnnouncement() { if (!announcement) return; await supabase.from('announcement').update({ active: !announcement.active }).eq('id', announcement.id); fetchAnnouncement() }
  async function addCategory(name: string) { await supabase.from('categories').insert([{ name }]); fetchCategories() }
  async function deleteCategory(name: string) { if (!confirm(`Delete category "${name}"?`)) return; await supabase.from('categories').delete().eq('name', name); fetchCategories() }
  function login() { if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) { setAuthed(true); setError('') } else setError('Incorrect password. Try again.') }
  function formatPrice(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
  function badgeText(price: number, salePrice: number, badgeType: string) {
    if (badgeType === 'percent_off') return `${Math.round((1 - salePrice / price) * 100)}% OFF`
    if (badgeType === 'dollars_off') return `$${formatPrice(price - salePrice)} OFF`
    if (badgeType === 'save_dollars') return `SAVE $${formatPrice(price - salePrice)}`
    return ''
  }
  async function handleSubmit() {
    if (!form.name || !form.price) { setError('Name and price are required.'); return }
    if (!form.category) { setError('Please create a category first, then select it.'); return }
    setLoading(true); setError('')
    const uploadedUrls: string[] = []
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop(); const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file)
      if (upErr) { setError('Image upload failed.'); setLoading(false); return }
      const { data: ud } = supabase.storage.from('product-images').getPublicUrl(fileName); uploadedUrls.push(ud.publicUrl)
    }
    const salePrice = form.sale_price ? parseFloat(form.sale_price) : null
    const maxOrder = products.length > 0 ? Math.max(...products.map(p => p.sort_order || 0)) + 1 : 0
    const { error: insertError } = await supabase.from('products').insert([{ name: form.name, description: form.description, price: parseFloat(form.price), sale_price: salePrice, sale_badge_type: salePrice ? form.sale_badge_type : null, category: form.category, sold: form.sold, stock: form.has_variants ? 0 : form.stock, has_variants: form.has_variants, image_url: uploadedUrls[0] || '', images: uploadedUrls, sort_order: maxOrder }])
    if (insertError) setError('Failed to add product.')
    else { setSuccess('Product added!'); setForm({ name: '', description: '', price: '', sale_price: '', sale_badge_type: 'percent_off', category: categories[0] || '', sold: false, stock: 0, has_variants: false }); setImageFiles([]); setImagePreviews([]); fetchProducts(); setTimeout(() => setSuccess(''), 3000) }
    setLoading(false)
  }
  async function deleteProduct(id: string) { if (!confirm('Delete this product?')) return; await supabase.from('products').delete().eq('id', id); fetchProducts() }
  function openEdit(p: Product) {
    setEditProduct(p)
    setEditForm({ name: p.name, description: p.description || '', price: p.price.toString(), sale_price: p.sale_price?.toString() || '', sale_badge_type: p.sale_badge_type || 'percent_off', category: p.category, sold: p.sold, stock: p.stock || 0, has_variants: p.has_variants || false })
    setEditImages(p.images?.length ? p.images : p.image_url ? [p.image_url] : [])
    setEditNewFiles([]); setEditNewPreviews([])
    if (p.has_variants) fetchVariantsForProduct(p.id); else setEditVariants([])
    setShowEditModal(true)
  }
  async function saveVariants(productId: string) {
    await supabase.from('variants').delete().eq('product_id', productId)
    const toInsert = editVariants.filter(v => v.label.trim() !== '').map((v, i) => ({ product_id: productId, label: v.label.trim(), stock: v.stock, price_override: v.price_override ? parseFloat(v.price_override) : null, image_url: v.image_url || null, order: i }))
    if (toInsert.length === 0) return
    const { error } = await supabase.from('variants').insert(toInsert)
    if (error) alert(`Failed to save variants: ${error.message}`)
  }
  async function saveEdit() {
    if (!editProduct) return; setLoading(true)
    const uploadedUrls: string[] = []
    for (const file of editNewFiles) {
      const ext = file.name.split('.').pop(); const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file)
      if (!upErr) { const { data: ud } = supabase.storage.from('product-images').getPublicUrl(fileName); uploadedUrls.push(ud.publicUrl) }
    }
    const allImages = [...editImages, ...uploadedUrls]
    const salePrice = editForm.sale_price ? parseFloat(editForm.sale_price) : null
    await supabase.from('products').update({ name: editForm.name, description: editForm.description, price: parseFloat(editForm.price), sale_price: salePrice, sale_badge_type: salePrice ? editForm.sale_badge_type : null, category: editForm.category, sold: editForm.sold, stock: editForm.has_variants ? 0 : editForm.stock, has_variants: editForm.has_variants, image_url: allImages[0] || '', images: allImages }).eq('id', editProduct.id)
    if (editForm.has_variants) await saveVariants(editProduct.id)
    else await supabase.from('variants').delete().eq('product_id', editProduct.id)
    setShowEditModal(false); setLoading(false); fetchProducts()
  }
  async function toggleSold(id: string, sold: boolean) { await supabase.from('products').update({ sold: !sold }).eq('id', id); fetchProducts() }
  function openNewPolicy() { setEditingPolicy(null); setPolicyForm({ title: '', content: '' }); setShowPolicyModal(true) }
  function openEditPolicy(pol: Policy) { setEditingPolicy(pol); setPolicyForm({ title: pol.title, content: pol.content }); setShowPolicyModal(true) }
  async function savePolicy() {
    if (!policyForm.title.trim() || !policyForm.content.trim()) return
    if (editingPolicy) await supabase.from('policies').update({ title: policyForm.title, content: policyForm.content }).eq('id', editingPolicy.id)
    else { const maxOrder = policies.length > 0 ? Math.max(...policies.map(p => p.order)) + 1 : 0; await supabase.from('policies').insert([{ title: policyForm.title, content: policyForm.content, order: maxOrder }]) }
    setShowPolicyModal(false); fetchPolicies()
  }
  async function deletePolicy(id: string) { if (!confirm('Delete this policy?')) return; await supabase.from('policies').delete().eq('id', id); fetchPolicies() }
  function addVariant() { setEditVariants([...editVariants, { label: '', stock: 0, price_override: '', image_url: '', order: editVariants.length }]) }
  function removeVariant(i: number) { setEditVariants(editVariants.filter((_, idx) => idx !== i)) }
  function updateVariant(i: number, field: keyof Variant, value: any) { const u = [...editVariants]; u[i] = { ...u[i], [field]: value }; setEditVariants(u) }
  async function fetchVariantsForProduct(productId: string) {
    setVariantsLoading(true)
    const { data } = await supabase.from('variants').select('*').eq('product_id', productId).order('order', { ascending: true })
    setEditVariants(data?.map(v => ({ id: v.id, label: v.label, stock: v.stock, price_override: v.price_override?.toString() || '', image_url: v.image_url || '', order: v.order })) || [])
    setVariantsLoading(false)
  }
  async function uploadVariantImage(i: number, file: File) {
    const ext = file.name.split('.').pop(); const fileName = `variant-${Date.now()}-${i}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (!error) { const { data: ud } = supabase.storage.from('product-images').getPublicUrl(fileName); updateVariant(i, 'image_url', ud.publicUrl) }
  }

  const unreadCount = contactSubmissions.filter(s => !s.read).length

  // ── JSX sections ──────────────────────────────────────────────────────────
  const announcementSection = (
    <div style={{ background: C.panel, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, marginBottom: 16, color: C.text, fontWeight: 700 }}>Announcement Bar</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: announcement?.active ? '#4caf50' : C.textMuted, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: announcement?.active ? (isDark ? '#88dd88' : '#27AE60') : C.textMuted, fontWeight: 600 }}>{announcement?.active ? 'Live on site' : 'Hidden from site'}</span>
        <button onClick={toggleAnnouncement} style={{ marginLeft: 'auto', background: announcement?.active ? C.error : C.success, color: announcement?.active ? C.errorText : C.successText, border: `1px solid ${announcement?.active ? C.errorBorder : C.successBorder}`, borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          {announcement?.active ? 'Hide' : 'Show'}
        </button>
      </div>
      <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)} rows={2} style={{ ...inputStyle, marginBottom: 12, resize: 'vertical' }} />
      <button onClick={saveAnnouncement} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Save Announcement</button>
    </div>
  )

  const categoriesSection = (
    <div style={{ background: C.panel, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, marginBottom: 16, color: C.text, fontWeight: 700 }}>Manage Categories</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.card, borderRadius: 100, padding: '6px 12px', border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{cat}</span>
            <button onClick={() => deleteCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" placeholder="New category name..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newCategoryName.trim()) { addCategory(newCategoryName.trim()); setNewCategoryName('') } }} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
        <button onClick={() => { if (newCategoryName.trim()) { addCategory(newCategoryName.trim()); setNewCategoryName('') } }} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>+ Add</button>
      </div>
    </div>
  )

  const policiesSection = (
    <div style={{ background: C.panel, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, margin: 0, color: C.text, fontWeight: 700 }}>Policies</h2>
        <button onClick={openNewPolicy} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>+ New Policy</button>
      </div>
      {policies.length === 0 && <p style={{ color: C.textMuted, fontSize: 13 }}>No policies yet.</p>}
      {policies.map(pol => (
        <div key={pol.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: C.text }}>{pol.title}</p>
            <p style={{ fontSize: 12, color: C.textMuted, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pol.content.substring(0, 80)}{pol.content.length > 80 ? '...' : ''}</p>
          </div>
          <button onClick={() => openEditPolicy(pol)} style={{ background: C.editBtn, color: C.editBtnText, border: `1px solid ${C.editBtnBorder}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>✏️ Edit</button>
          <button onClick={() => deletePolicy(pol.id)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, color: C.textMuted, cursor: 'pointer', flexShrink: 0 }}>🗑</button>
        </div>
      ))}
    </div>
  )

  const contactSection = showContactFeature ? (
    <>
      {/* Contact Info */}
      <div style={{ background: C.panel, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, marginBottom: 16, color: C.text, fontWeight: 700 }}>Contact Page Info</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: C.label, display: 'block', marginBottom: 5, fontWeight: 600 }}>Headline</label>
            <input value={contactInfo.headline} onChange={e => setContactInfo({ ...contactInfo, headline: e.target.value })} placeholder="e.g. Questions?" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.label, display: 'block', marginBottom: 5, fontWeight: 600 }}>Intro text</label>
            <input value={contactInfo.intro} onChange={e => setContactInfo({ ...contactInfo, intro: e.target.value })} placeholder="e.g. We're here to help!" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.label, display: 'block', marginBottom: 5, fontWeight: 600 }}>Phone / WhatsApp</label>
            <input value={contactInfo.phone} onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })} placeholder="+1 234 567 8900" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.label, display: 'block', marginBottom: 5, fontWeight: 600 }}>Email</label>
            <input value={contactInfo.email} onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })} placeholder="you@email.com" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: C.label, display: 'block', marginBottom: 5, fontWeight: 600 }}>WhatsApp link <span style={{ color: C.textMuted, fontWeight: 400 }}>(generates QR code)</span></label>
          <input value={contactInfo.whatsapp_url} onChange={e => setContactInfo({ ...contactInfo, whatsapp_url: e.target.value })} placeholder="https://wa.me/1234567890" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: C.label, display: 'block', marginBottom: 5, fontWeight: 600 }}>Extra info <span style={{ color: C.textMuted, fontWeight: 400 }}>optional</span></label>
          <textarea value={contactInfo.extra} onChange={e => setContactInfo({ ...contactInfo, extra: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <button onClick={saveContactInfo} disabled={contactInfoSaving} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: contactInfoSaving ? 0.7 : 1 }}>
          {contactInfoSaving ? 'Saving...' : 'Save Contact Info'}
        </button>
      </div>

      {/* Contact Submissions */}
      <div style={{ background: C.panel, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, margin: 0, color: C.text, fontWeight: 700 }}>Contact Messages</h2>
            {unreadCount > 0 && (
              <div style={{ background: '#e53935', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }}>
                {unreadCount}
              </div>
            )}
            <style>{`@keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.15)} }`}</style>
          </div>
          <button onClick={openMessages} style={{ background: C.editBtn, color: C.editBtnText, border: `1px solid ${C.editBtnBorder}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {showContactSubmissions ? '▲ Hide' : `▼ Show${unreadCount > 0 ? ` (${unreadCount} new)` : ''}`}
          </button>
        </div>
        {showContactSubmissions && (
          contactSubmissions.length === 0
            ? <p style={{ color: C.textMuted, fontSize: 13 }}>No messages yet.</p>
            : contactSubmissions.map(s => (
              <div key={s.id} style={{ padding: '14px 0', borderBottom: `1px solid ${C.border}`, background: !s.read ? (isDark ? 'rgba(100,160,255,0.05)' : 'rgba(100,160,255,0.06)') : 'transparent', borderRadius: !s.read ? 8 : 0, paddingLeft: !s.read ? 10 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  {!s.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.name}</span>
                  <a href={`mailto:${s.email}`} style={{ fontSize: 12, color: C.editBtnText, textDecoration: 'none' }}>{s.email}</a>
                  {s.phone && <span style={{ fontSize: 12, color: C.textMuted }}>{s.phone}</span>}
                  <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 'auto' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                  <button onClick={() => deleteSubmission(s.id)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, color: C.textMuted, cursor: 'pointer', flexShrink: 0 }}>🗑</button>
                </div>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap', paddingLeft: !s.read ? 18 : 0 }}>{s.message}</p>
              </div>
            ))
        )}
      </div>

      {/* Email Subscribers */}
      <div style={{ background: C.panel, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, marginBottom: 12, color: C.text, fontWeight: 700 }}>Email Subscribers ({emailSubscribers.length})</h2>
        {emailSubscribers.length === 0
          ? <p style={{ color: C.textMuted, fontSize: 13 }}>No subscribers yet.</p>
          : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {emailSubscribers.map(s => (
                <div key={s.id} style={{ background: C.card, borderRadius: 100, padding: '5px 14px', border: `1px solid ${C.border}`, fontSize: 12, color: C.text }}>{s.email}</div>
              ))}
            </div>}
      </div>
    </>
  ) : null

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(adminSearch.toLowerCase()) && (adminFilter === 'All' || p.category === adminFilter))
  const displayList = reorderMode ? reorderListRef.current : []

  if (accentColor === null) return null

  if (!authed) return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: 16 }}>
        <div style={{ background: C.panel, borderRadius: 16, padding: 40, width: '100%', maxWidth: 340, boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, margin: 0, color: C.text }}>Store <em style={{ color: accent }}>Admin</em></h1>
            <button onClick={toggleMode} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontSize: 16, color: C.text }}>{isDark ? '☀️' : '🌙'}</button>
          </div>
          <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>Only the store owner can access this page.</p>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input type={showPassword ? 'text' : 'password'} placeholder="Enter admin password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} style={{ ...inputStyle, paddingRight: 44 }} />
            <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.textMuted }}>{showPassword ? '🙈' : '👁️'}</button>
          </div>
          {error && <p style={{ color: isDark ? '#ff6b6b' : accent, fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button onClick={login} style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Login →</button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ fontFamily: 'DM Sans, sans-serif', background: C.bg, minHeight: '100vh' }}>

        {/* Ghost */}
        <div ref={ghostRef} style={{ display: 'none', position: 'fixed', zIndex: 9999, pointerEvents: 'none', width: 300, background: C.panel, border: `2px solid ${accent}`, borderRadius: 10, padding: '8px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', alignItems: 'center', gap: 10, opacity: 0.96 }}>
          <span style={{ fontSize: 16, color: accent, flexShrink: 0 }}>⠿</span>
          <img style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} alt="" />
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}></p>
        </div>

        <nav className="admin-nav" style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: C.text }}>Store <em style={{ color: accent }}>Admin</em></div>
            {showContactFeature && unreadCount > 0 && (
              <div style={{ background: '#e53935', color: '#fff', borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={toggleMode} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 15, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, color: C.text }}>← Store</button>
          </div>
        </nav>

        <div className="mobile-top-sections admin-outer" style={{ display: 'none', maxWidth: 1000, margin: '0 auto', padding: '16px 12px 0' }}>
          {announcementSection}{categoriesSection}{policiesSection}{contactSection}
        </div>

        <div className="admin-outer admin-grid" style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>

          {/* ADD PRODUCT */}
          <Panel C={C} isDark={isDark} style={{ height: 'fit-content' }}>
            <SectionTitle C={C}>Add a Product</SectionTitle>
            {categories.length === 0 && (
              <div style={{ background: '#FEF3CD', color: '#6B4F00', border: '1px solid #E0C068', padding: '12px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                ⚠️ Create a category first (in the "Manage Categories" section) before adding products. Every product needs a category.
              </div>
            )}
            {success && <div style={{ background: C.success, color: C.successText, border: `1px solid ${C.successBorder}`, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>✓ {success}</div>}
            {error && <div style={{ background: C.error, color: C.errorText, border: `1px solid ${C.errorBorder}`, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{error}</div>}
            <Label C={C}>Product Name *</Label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Vintage Baseball Card" style={{ ...inputStyle, marginBottom: 14 }} />
            <Label C={C}>Description</Label>
            <MarkdownToolbar textareaId="add-description" value={form.description} onChange={v => setForm({ ...form, description: v })} C={C} />
            <textarea id="add-description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} style={{ ...inputStyle, marginBottom: 14, resize: 'vertical' }} />
            <Label C={C}>Price ($) *</Label>
            <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} type="number" min="0" step="0.01" style={{ ...inputStyle, marginBottom: 14 }} />
            <Label C={C}>Sale Price ($) <span style={{ color: C.textMuted, fontWeight: 400 }}>optional</span></Label>
            <input value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} type="number" min="0" step="0.01" style={{ ...inputStyle, marginBottom: 10 }} />
            {form.sale_price && (
              <>
                <Label C={C}>Sale Badge Style</Label>
                <SaleBadgeSelector value={form.sale_badge_type} onChange={v => setForm({ ...form, sale_badge_type: v })} accent={accent} C={C} />
                {form.price && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, background: C.card, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}` }}>Preview: <strong style={{ color: accent }}>{badgeText(parseFloat(form.price), parseFloat(form.sale_price), form.sale_badge_type)}</strong></div>}
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', background: form.has_variants ? C.editBtn : C.card, borderRadius: 10, border: `1px solid ${form.has_variants ? C.editBtnBorder : C.border}` }}>
              <input type="checkbox" id="has-variants-add" checked={form.has_variants} onChange={e => setForm({ ...form, has_variants: e.target.checked })} style={{ accentColor: accent }} />
              <label htmlFor="has-variants-add" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', color: form.has_variants ? C.editBtnText : C.textMuted }}>
                {form.has_variants ? '✓ This product has variants' : 'This product has variants (colors, sizes, etc.)'}
              </label>
            </div>
            {!form.has_variants && (<><Label C={C}>Stock Quantity</Label><input value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} type="number" min="0" style={{ ...inputStyle, marginBottom: 14 }} /></>)}
            {form.has_variants && <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Stock is managed per variant. Add variants after saving via Edit.</p>}
            <Label C={C}>Category</Label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <Label C={C}>Product Images</Label>
            <input type="file" accept="image/*" multiple onChange={e => { const files = Array.from(e.target.files || []); setImageFiles(files); setImagePreviews(files.map(f => URL.createObjectURL(f))) }} style={{ ...inputStyle, marginBottom: 14 }} />
            {imagePreviews.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>{imagePreviews.map((src, i) => <img key={i} src={src} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }} />)}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input type="checkbox" id="sold" checked={form.sold} onChange={e => setForm({ ...form, sold: e.target.checked })} style={{ accentColor: accent }} />
              <label htmlFor="sold" style={{ fontSize: 13, color: C.text, cursor: 'pointer' }}>Mark as sold</label>
            </div>
            <button onClick={handleSubmit} disabled={loading || categories.length === 0} style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: (loading || categories.length === 0) ? 'not-allowed' : 'pointer', fontSize: 14, opacity: (loading || categories.length === 0) ? 0.5 : 1, boxShadow: `0 4px 16px ${accent}44` }}>
              {loading ? 'Adding...' : categories.length === 0 ? 'Create a category first' : '+ Add Product'}
            </button>
          </Panel>

          {/* PRODUCT LIST */}
          <Panel C={C} isDark={isDark}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
              <SectionTitle C={C}>All Products ({products.length})</SectionTitle>
              {!reorderMode
                ? <button onClick={enterReorderMode} style={{ background: C.editBtn, color: C.editBtnText, border: `1px solid ${C.editBtnBorder}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>⠿ Reorder</button>
                : <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveOrder} disabled={savingOrder} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: savingOrder ? 'not-allowed' : 'pointer', opacity: savingOrder ? 0.7 : 1 }}>{savingOrder ? 'Saving...' : '✓ Save Order'}</button>
                    <button onClick={cancelReorder} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: C.textMuted }}>Cancel</button>
                  </div>
              }
            </div>
            {!reorderMode && (
              <>
                <input type="text" placeholder="Search products..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {['All', ...categories].map(cat => (
                    <button key={cat} onClick={() => setAdminFilter(cat)} style={{ padding: '5px 12px', borderRadius: 100, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: adminFilter === cat ? accent : C.card, color: adminFilter === cat ? '#fff' : C.textMuted }}>{cat}</button>
                  ))}
                </div>
              </>
            )}
            {reorderMode && <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 12, padding: '8px 12px', background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>Hold and drag to reposition, then click <strong style={{ color: C.text }}>Save Order</strong>.</p>}
            {products.length === 0 && <p style={{ color: C.textMuted, fontSize: 14 }}>No products yet.</p>}
            <div ref={scrollRef} style={{ maxHeight: reorderMode ? 600 : 520, overflowY: 'auto', marginRight: -8, paddingRight: 8, position: 'relative' }}>
              {reorderMode && <div ref={lineRef} style={{ display: 'none', position: 'absolute', left: 0, right: 0, height: 3, background: accent, borderRadius: 2, zIndex: 10, pointerEvents: 'none' }} />}
              {reorderMode
                ? displayList.map((p, i) => (
                    <div key={p.id} ref={el => { rowRefs.current[i] = el }} onMouseDown={e => onMouseDown(e, i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, cursor: 'grab', userSelect: 'none', transition: 'opacity 0.1s' }}>
                      <span style={{ fontSize: 18, color: C.textMuted, flexShrink: 0 }}>⠿</span>
                      <img src={p.image_url || 'https://via.placeholder.com/60?text=No+Img'} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: `1px solid ${C.border}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: C.textMuted, margin: '2px 0 0' }}>{p.category} · ${formatPrice(p.sale_price ?? p.price)}</p>
                      </div>
                      <span style={{ fontSize: 11, color: C.textMuted, background: C.card, padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.border}`, flexShrink: 0 }}>#{i + 1}</span>
                    </div>
                  ))
                : filteredProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
                      <img src={p.image_url || 'https://via.placeholder.com/60?text=No+Img'} alt={p.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: `1px solid ${C.border}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, color: C.text }}>
                          {p.name}
                          {p.has_variants && <span style={{ fontSize: 10, background: C.variantBadge, color: C.variantBadgeText, borderRadius: 4, padding: '1px 6px', marginLeft: 6, fontWeight: 600, border: `1px solid ${C.variantBadgeBorder}` }}>VARIANTS</span>}
                        </p>
                        <p style={{ fontSize: 12, color: C.textMuted, margin: '2px 0 0' }}>
                          {p.category} · {p.sale_price ? <><span style={{ textDecoration: 'line-through', color: C.textMuted }}>${formatPrice(p.price)}</span> <span style={{ color: accent, fontWeight: 700 }}>${formatPrice(p.sale_price)}</span></> : `$${formatPrice(p.price)}`} · {p.sold ? '🔴 Sold' : '🟢 Available'}
                        </p>
                      </div>
                      <div className="product-row-buttons" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => openEdit(p)} style={{ background: C.editBtn, color: C.editBtnText, border: `1px solid ${C.editBtnBorder}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={() => toggleSold(p.id, p.sold)} style={{ background: p.sold ? C.success : C.error, color: p.sold ? C.successText : C.errorText, border: `1px solid ${p.sold ? C.successBorder : C.errorBorder}`, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{p.sold ? '✓ Available' : 'Mark Sold'}</button>
                        <button onClick={() => deleteProduct(p.id)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: C.textMuted, cursor: 'pointer' }}>🗑</button>
                      </div>
                    </div>
                  ))
              }
            </div>
          </Panel>
        </div>

        <div className="desktop-bottom-sections admin-outer" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 32px' }}>
          {announcementSection}{categoriesSection}{policiesSection}{contactSection}
        </div>

        {/* EDIT MODAL */}
        {showEditModal && editProduct && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: C.panel, borderRadius: 16, padding: 24, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, margin: 0, color: C.text }}>Edit Product</h2>
                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: C.textMuted }}>×</button>
              </div>
              <Label C={C}>Product Name</Label>
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }} />
              <Label C={C}>Description</Label>
              <MarkdownToolbar textareaId="edit-description" value={editForm.description} onChange={v => setEditForm({ ...editForm, description: v })} C={C} />
              <textarea id="edit-description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={4} style={{ ...inputStyle, marginBottom: 14, resize: 'vertical' }} />
              <Label C={C}>Price ($)</Label>
              <input value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} type="number" min="0" step="0.01" style={{ ...inputStyle, marginBottom: 14 }} />
              <Label C={C}>Sale Price ($) <span style={{ color: C.textMuted, fontWeight: 400 }}>optional</span></Label>
              <input value={editForm.sale_price} onChange={e => setEditForm({ ...editForm, sale_price: e.target.value })} type="number" min="0" step="0.01" style={{ ...inputStyle, marginBottom: 10 }} />
              {editForm.sale_price && (
                <>
                  <SaleBadgeSelector value={editForm.sale_badge_type} onChange={v => setEditForm({ ...editForm, sale_badge_type: v })} accent={accent} C={C} />
                  {editForm.price && <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, background: C.card, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}` }}>Preview: <strong style={{ color: accent }}>{badgeText(parseFloat(editForm.price), parseFloat(editForm.sale_price), editForm.sale_badge_type)}</strong></div>}
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', background: editForm.has_variants ? C.editBtn : C.card, borderRadius: 10, border: `1px solid ${editForm.has_variants ? C.editBtnBorder : C.border}` }}>
                <input type="checkbox" id="has-variants-edit" checked={editForm.has_variants} onChange={e => { setEditForm({ ...editForm, has_variants: e.target.checked }); if (e.target.checked) fetchVariantsForProduct(editProduct.id); else setEditVariants([]) }} style={{ accentColor: accent }} />
                <label htmlFor="has-variants-edit" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', color: editForm.has_variants ? C.editBtnText : C.textMuted }}>{editForm.has_variants ? '✓ This product has variants' : 'This product has variants (colors, sizes, etc.)'}</label>
              </div>
              {!editForm.has_variants && (<><Label C={C}>Stock Quantity</Label><input value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })} type="number" min="0" style={{ ...inputStyle, marginBottom: 14 }} /></>)}
              {editForm.has_variants && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: C.text }}>Variants</h3>
                    <button onClick={addVariant} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add Variant</button>
                  </div>
                  {variantsLoading && <p style={{ fontSize: 12, color: C.textMuted }}>Loading variants...</p>}
                  {editVariants.map((v, i) => (
                    <div key={i} style={{ background: C.card, borderRadius: 10, padding: 12, marginBottom: 10, border: `1px solid ${C.border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: 8, marginBottom: 8 }}>
                        <div><label style={{ fontSize: 11, color: C.label, display: 'block', marginBottom: 3 }}>Label *</label><input value={v.label} onChange={e => updateVariant(i, 'label', e.target.value)} placeholder="e.g. Red, Size M" style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${C.inputBorder}`, fontSize: 12, background: C.input, color: C.text, boxSizing: 'border-box' }} /></div>
                        <div><label style={{ fontSize: 11, color: C.label, display: 'block', marginBottom: 3 }}>Stock *</label><input value={v.stock} onChange={e => updateVariant(i, 'stock', parseInt(e.target.value) || 0)} type="number" min="0" style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${C.inputBorder}`, fontSize: 12, background: C.input, color: C.text, boxSizing: 'border-box' }} /></div>
                        <div><label style={{ fontSize: 11, color: C.label, display: 'block', marginBottom: 3 }}>Price Override ($)</label><input value={v.price_override} onChange={e => updateVariant(i, 'price_override', e.target.value)} placeholder="Optional" type="number" min="0" step="0.01" style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${C.inputBorder}`, fontSize: 12, background: C.input, color: C.text, boxSizing: 'border-box' }} /></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}><label style={{ fontSize: 11, color: C.label, display: 'block', marginBottom: 3 }}>Variant Image</label><input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadVariantImage(i, f) }} style={{ fontSize: 11, color: C.textMuted }} /></div>
                        {v.image_url && <img src={v.image_url} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: `1px solid ${C.border}` }} />}
                        <button onClick={() => removeVariant(i)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, color: C.textMuted, cursor: 'pointer', flexShrink: 0 }}>🗑</button>
                      </div>
                    </div>
                  ))}
                  {editVariants.length === 0 && !variantsLoading && <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '12px 0' }}>No variants yet. Click + Add Variant.</p>}
                </div>
              )}
              <Label C={C}>Category</Label>
              <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <input type="checkbox" id="edit-sold" checked={editForm.sold} onChange={e => setEditForm({ ...editForm, sold: e.target.checked })} style={{ accentColor: accent }} />
                <label htmlFor="edit-sold" style={{ fontSize: 13, color: C.text, cursor: 'pointer' }}>Mark as sold</label>
              </div>
              <Label C={C}>Current Images <span style={{ color: C.textMuted, fontWeight: 400 }}>(drag to reorder, × to remove)</span></Label>
              <div className="edit-image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {editImages.map((img, i) => (
                  <div key={i} draggable onDragStart={e => e.dataTransfer.setData('text/plain', i.toString())} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from === i) return; const u = [...editImages]; const [m] = u.splice(from, 1); u.splice(i, 0, m); setEditImages(u) }} style={{ position: 'relative', cursor: 'grab' }}>
                    <img src={img} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: i === 0 ? `2px solid ${accent}` : `2px solid ${C.border}` }} />
                    {i === 0 && <span style={{ position: 'absolute', bottom: 4, left: 4, background: accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>MAIN</span>}
                    <button onClick={() => setEditImages(editImages.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
              <Label C={C}>Add More Images</Label>
              <input type="file" accept="image/*" multiple onChange={e => { const files = Array.from(e.target.files || []); setEditNewFiles(files); setEditNewPreviews(files.map(f => URL.createObjectURL(f))) }} style={{ ...inputStyle, marginBottom: 14 }} />
              {editNewPreviews.length > 0 && <div className="edit-image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>{editNewPreviews.map((src, i) => <img key={i} src={src} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: `2px solid ${C.border}` }} />)}</div>}
              <button onClick={saveEdit} disabled={loading} style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, opacity: loading ? 0.7 : 1, boxShadow: `0 4px 16px ${accent}44` }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* POLICY MODAL */}
        {showPolicyModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: C.panel, borderRadius: 16, padding: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, margin: 0, color: C.text }}>{editingPolicy ? 'Edit Policy' : 'New Policy'}</h2>
                <button onClick={() => setShowPolicyModal(false)} style={{ background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: C.textMuted }}>×</button>
              </div>
              <Label C={C}>Title *</Label>
              <input value={policyForm.title} onChange={e => setPolicyForm({ ...policyForm, title: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }} />
              <Label C={C}>Content *</Label>
              <MarkdownToolbar textareaId="policy-content" value={policyForm.content} onChange={v => setPolicyForm({ ...policyForm, content: v })} C={C} />
              <textarea id="policy-content" value={policyForm.content} onChange={e => setPolicyForm({ ...policyForm, content: e.target.value })} rows={12} style={{ ...inputStyle, marginBottom: 20, resize: 'vertical', lineHeight: 1.7 }} />
              <button onClick={savePolicy} disabled={!policyForm.title.trim() || !policyForm.content.trim()} style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: (!policyForm.title.trim() || !policyForm.content.trim()) ? 0.5 : 1 }}>
                {editingPolicy ? 'Save Changes' : 'Create Policy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}