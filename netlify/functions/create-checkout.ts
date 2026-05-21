import type { Handler } from '@netlify/functions'
import { PACK_CREDITS } from './_products'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const { productId } = JSON.parse(event.body || '{}') as { productId: string }
  const credits = PACK_CREDITS[productId]

  if (!credits) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid product ID' }) }
  }

  const siteUrl = process.env.SITE_URL || 'http://localhost:5173'

  try {
    const res = await fetch('https://api.dodopayments.com/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DODO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billing: { city: '', country: 'US', state: '', street: '', zipcode: '' },
        customer: { create_new_customer: true },
        product_cart: [{ product_id: productId, quantity: 1 }],
        payment_link: true,
        return_url: `${siteUrl}/payment-success`,
        metadata: { credits: String(credits) },
      }),
    })

    const data = await res.json() as { payment_link?: string; payment_id?: string }
    if (!res.ok) throw new Error(JSON.stringify(data))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutUrl: data.payment_link, paymentId: data.payment_id }),
    }
  } catch (err) {
    console.error('create-checkout error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}
