import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET as string)
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Read cart summary from metadata (has product ids, variant ids, and quantities)
    const cartSummary: { id: string; qty: number; variant_id: string | null }[] = session.metadata?.cart_summary
      ? JSON.parse(session.metadata.cart_summary)
      : []

    for (const item of cartSummary) {
      const qty = item.qty || 1
      if (item.variant_id) {
        // Decrement variant stock
        const { data: variant } = await supabase.from('variants').select('stock').eq('id', item.variant_id).single()
        if (variant) {
          await supabase.from('variants').update({ stock: Math.max(0, variant.stock - qty) }).eq('id', item.variant_id)
        }
      } else {
        // Decrement product stock
        const { data: product } = await supabase.from('products').select('stock').eq('id', item.id).single()
        if (product) {
          await supabase.from('products').update({ stock: Math.max(0, product.stock - qty) }).eq('id', item.id)
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}