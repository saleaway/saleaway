import type { CSSProperties } from 'react'

export interface Theme {
  bg_page: string
  bg_card: string
  bg_nav: string
  bg_footer: string
  text_primary: string
  text_secondary: string
  text_price: string
  text_nav: string
  text_search: string
  border_card_color: string
  border_card_width: number
  border_nav_color: string
  badge_bg: string
  badge_text: string

  font_heading: string
  font_body: string
  font_size_base: number
  font_size_price: number
  font_weight_heading: number
  font_weight_btn: number
  heading_effect: 'none' | 'metallic_silver' | 'metallic_gold' | 'rustic' | 'embossed' | 'neon'

  radius_card: number
  radius_btn: number
  radius_input: number
  radius_image: number

  btn_style: 'solid' | 'outline' | 'soft'
  btn_size: 'compact' | 'normal' | 'large'

  card_shadow: 'none' | 'soft' | 'medium' | 'strong'
  card_hover: 'lift' | 'glow' | 'scale' | 'none'
  card_padding: number
  card_text_align: 'left' | 'center'
  card_image_ratio: 'square' | 'portrait' | 'landscape'

  page_max_width: number
  grid_gap: number
  grid_columns: number
  section_gap: number

  nav_sticky: boolean
  nav_height: number
  nav_logo_height: number

  hero_style: 'gradient' | 'solid' | 'minimal' | 'image' | 'stripes' | 'dots' | 'mesh' | 'dark'
  hero_show_badge: boolean
  hero_padding: number
  hero_text_align: 'left' | 'center'
  hero_bg_image_url: string
  hero_bg_overlay: number

  announcement_bg: string
  announcement_text: string

  footer_bg: string
  footer_text: string
  footer_show_powered_by: boolean

  category_style: 'pills' | 'underline' | 'dropdown' | 'hidden'

  scroll_effect: 'none' | 'fade_up' | 'fade_in' | 'zoom_in' | 'slide_in' | 'stagger'
  scroll_behavior: 'once' | 'filter' | 'always'
}

export const DEFAULT_THEME: Theme = {
  bg_page: '#F5F2EE',
  bg_card: '#ffffff',
  bg_nav: 'rgba(255,255,255,0.95)',
  bg_footer: '#ffffff',
  text_primary: '#1A1714',
  text_secondary: '#666666',
  text_price: '',
  text_nav: '#1A1714',
  text_search: '#1A1714',
  border_card_color: '#eeeeee',
  border_card_width: 1,
  border_nav_color: '#e5e5e5',
  badge_bg: '',
  badge_text: '#ffffff',

  font_heading: 'Georgia, serif',
  font_body: "'DM Sans', sans-serif",
  font_size_base: 14,
  font_size_price: 18,
  font_weight_heading: 700,
  font_weight_btn: 700,
  heading_effect: 'none',

  radius_card: 12,
  radius_btn: 100,
  radius_input: 8,
  radius_image: 0,

  btn_style: 'solid',
  btn_size: 'normal',

  card_shadow: 'soft',
  card_hover: 'lift',
  card_padding: 14,
  card_text_align: 'left',
  card_image_ratio: 'square',

  page_max_width: 1200,
  grid_gap: 16,
  grid_columns: 0,
  section_gap: 28,

  nav_sticky: true,
  nav_height: 60,
  nav_logo_height: 36,

  hero_style: 'gradient',
  hero_show_badge: true,
  hero_padding: 40,
  hero_text_align: 'left',
  hero_bg_image_url: '',
  hero_bg_overlay: 40,

  announcement_bg: '#1A1714',
  announcement_text: '#F5F2EE',

  footer_bg: '#ffffff',
  footer_text: '#666666',
  footer_show_powered_by: true,

  category_style: 'pills',

  scroll_effect: 'fade_up',
  scroll_behavior: 'once',
}

export function mergeTheme(saved: Partial<Theme> | null | undefined): Theme {
  return { ...DEFAULT_THEME, ...(saved || {}) }
}

export function cardShadow(t: Theme): string {
  if (t.card_shadow === 'none') return 'none'
  if (t.card_shadow === 'soft') return '0 1px 4px rgba(0,0,0,0.06)'
  if (t.card_shadow === 'medium') return '0 4px 16px rgba(0,0,0,0.10)'
  if (t.card_shadow === 'strong') return '0 8px 32px rgba(0,0,0,0.18)'
  return 'none'
}

export function cardImageRatio(t: Theme): string {
  if (t.card_image_ratio === 'portrait') return '4/5'
  if (t.card_image_ratio === 'landscape') return '4/3'
  return '1'
}

export function cardHoverStyles(t: Theme, accent: string): { enter: Record<string, any>; leave: Record<string, any> } {
  if (t.card_hover === 'lift') return {
    enter: { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
    leave: { transform: 'translateY(0)', boxShadow: cardShadow(t) },
  }
  if (t.card_hover === 'glow') return {
    enter: { transform: 'translateY(0)', boxShadow: `0 0 0 3px ${accent}44` },
    leave: { transform: 'translateY(0)', boxShadow: cardShadow(t) },
  }
  if (t.card_hover === 'scale') return {
    enter: { transform: 'scale(1.02)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
    leave: { transform: 'scale(1)', boxShadow: cardShadow(t) },
  }
  return { enter: {}, leave: {} }
}

export function btnPadding(t: Theme): string {
  if (t.btn_size === 'compact') return '7px 14px'
  if (t.btn_size === 'large') return '14px 28px'
  return '10px 20px'
}

export function btnStyles(t: Theme, accent: string, active = true): CSSProperties {
  const pad = btnPadding(t)
  const base: CSSProperties = {
    borderRadius: t.radius_btn,
    padding: pad,
    fontWeight: t.font_weight_btn,
    cursor: 'pointer',
    fontSize: t.font_size_base,
    transition: 'all 0.2s ease',
    width: '100%',
  }
  if (t.btn_style === 'solid') return { ...base, background: active ? accent : '#ccc', color: '#fff', border: 'none' }
  if (t.btn_style === 'outline') return { ...base, background: 'transparent', color: accent, border: `2px solid ${accent}` }
  if (t.btn_style === 'soft') return { ...base, background: accent + '18', color: accent, border: 'none' }
  return base
}

export function gridColumns(t: Theme, isMobile: boolean): string {
  if (isMobile) return 'repeat(2, 1fr)'
  if (t.grid_columns === 0) return 'repeat(auto-fill, minmax(160px, 1fr))'
  return `repeat(${t.grid_columns}, 1fr)`
}

export function headingEffectStyles(effect: Theme['heading_effect']): CSSProperties {
  if (effect === 'metallic_silver') return {
    background: 'linear-gradient(180deg, #e8e8e8 0%, #a0a0a0 40%, #d0d0d0 60%, #787878 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: 'none',
  }
  if (effect === 'metallic_gold') return {
    background: 'linear-gradient(180deg, #f9e88a 0%, #c8960c 40%, #f0d060 60%, #9a6800 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: 'none',
  }
  if (effect === 'rustic') return {
    background: 'linear-gradient(180deg, #8B4513 0%, #5C2D0A 50%, #3D1C07 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    textShadow: '1px 1px 2px rgba(0,0,0,0.4)', letterSpacing: '0.04em',
  }
  if (effect === 'embossed') return { textShadow: '-1px -1px 1px rgba(255,255,255,0.6), 1px 1px 2px rgba(0,0,0,0.35)' }
  if (effect === 'neon') return { textShadow: '0 0 8px currentColor, 0 0 20px currentColor, 0 0 40px currentColor' }
  return {}
}

export function heroBgStyle(t: Theme, accent: string): CSSProperties {
  if (t.hero_style === 'image' && t.hero_bg_image_url) {
    return { backgroundImage: `url(${t.hero_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }
  }
  if (t.hero_style === 'solid') return { background: accent }
  if (t.hero_style === 'minimal') return { background: '#ffffff' }
  if (t.hero_style === 'stripes') return { background: `repeating-linear-gradient(45deg, ${accent}08, ${accent}08 10px, ${accent}18 10px, ${accent}18 20px)` }
  if (t.hero_style === 'dots') return { backgroundColor: t.bg_card, backgroundImage: `radial-gradient(${accent}33 1.5px, transparent 1.5px)`, backgroundSize: '22px 22px' }
  if (t.hero_style === 'mesh') return { background: `radial-gradient(ellipse at 20% 50%, ${accent}33 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, ${accent}22 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, ${accent}1a 0%, transparent 50%), ${t.bg_card}` }
  if (t.hero_style === 'dark') return { background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)` }
  return { background: `linear-gradient(135deg, ${t.bg_card} 0%, ${accent}11 50%, ${accent}22 100%)` }
}

export function heroTextColor(t: Theme): string {
  if (t.hero_style === 'solid' || t.hero_style === 'dark' || t.hero_style === 'image') return '#ffffff'
  return t.text_primary
}

export function scrollEffectCSS(effect: Theme['scroll_effect']): string {
  if (!effect || effect === 'none') return `
    .scroll-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  `
  const tr = 'transition: opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1);'
  const base = `
    .scroll-reveal.visible { opacity: 1 !important; transform: none !important; ${tr} }
    .scroll-reveal.reset { opacity: 0 !important; transition: none !important; }
  `
  if (effect === 'fade_up') return base + `
    .scroll-reveal { opacity: 0; transform: translateY(48px); ${tr} }
    .scroll-reveal.reset { transform: translateY(48px) !important; }
  `
  if (effect === 'fade_in') return base + `
    .scroll-reveal { opacity: 0; transition: opacity 0.7s ease; }
  `
  if (effect === 'zoom_in') return base + `
    .scroll-reveal { opacity: 0; transform: scale(0.82); ${tr} }
    .scroll-reveal.reset { transform: scale(0.82) !important; }
  `
  if (effect === 'slide_in') return base + `
    .scroll-reveal { opacity: 0; transform: translateX(-60px); ${tr} }
    .scroll-reveal.reset { transform: translateX(-60px) !important; }
  `
  if (effect === 'stagger') return base + `
    .scroll-reveal { opacity: 0; transform: translateY(36px); ${tr} }
    .scroll-reveal.reset { transform: translateY(36px) !important; }
    .scroll-reveal:nth-child(6n+2) { transition-delay: 0.1s; }
    .scroll-reveal:nth-child(6n+3) { transition-delay: 0.2s; }
    .scroll-reveal:nth-child(6n+4) { transition-delay: 0.3s; }
    .scroll-reveal:nth-child(6n+5) { transition-delay: 0.4s; }
    .scroll-reveal:nth-child(6n+6) { transition-delay: 0.5s; }
  `
  return base
}