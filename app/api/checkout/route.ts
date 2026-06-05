import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

export async function POST(req: NextRequest) {
  try {
    const { cart } = await req.json()

    // Stock check per item
    for (const item of cart) {
      if (item.variant_id) {
        const { data: variant } = await supabase.from('variants').select('stock, label').eq('id', item.variant_id).single()
        if (!variant) return NextResponse.json({ error: `"${item.name}" variant is no longer available.` }, { status: 400 })
        if (variant.stock < item.qty) return NextResponse.json({ error: `Sorry, only ${variant.stock} of "${item.name} — ${variant.label}" left in stock.` }, { status: 400 })
      } else {
        const { data: product } = await supabase.from('products').select('stock, name').eq('id', item.id).single()
        if (!product) return NextResponse.json({ error: `"${item.name}" is no longer available.` }, { status: 400 })
        if (product.stock < item.qty) return NextResponse.json({ error: `Sorry, only ${product.stock} of "${item.name}" left in stock.` }, { status: 400 })
      }
    }

    const line_items = cart.map((item: { name: string; price: number; qty: number; image_url: string; variant_label?: string }) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.variant_label ? `${item.name} — ${item.variant_label}` : item.name,
          images: item.image_url?.startsWith('http') ? [item.image_url] : []
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.qty
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `https://mystore-tan.vercel.app/success`,
      cancel_url: `https://mystore-tan.vercel.app/`,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB'] },
      metadata: {
        cart_summary: JSON.stringify(cart.map((i: any) => ({ id: i.id, qty: i.qty, variant_id: i.variant_id || null })))
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    return NextResponse.json({ error: 'Checkout failed', details: err }, { status: 500 })
  }
}