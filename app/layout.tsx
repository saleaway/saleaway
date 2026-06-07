import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

async function getSettings() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.from('settings').select('store_name, favicon_url').single()
    return data
  } catch { return null }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    title: settings?.store_name || 'Sale Away',
    description: 'Welcome to our store',
    icons: settings?.favicon_url ? { icon: settings.favicon_url } : undefined,
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, minHeight: '100vh' }}>{children}</body>
    </html>
  )
}