import type { VercelRequest, VercelResponse } from '@vercel/node'
import { PACK_CREDITS } from './_products'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const { productId, userId } = req.body as { productId: string; userId?: string | null }
  const credits = PACK_CREDITS[productId]

  if (!credits) {
    return res.status(400).json({ error: 'Invalid product ID' })
  }

  const siteUrl = process.env.SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173'

  if (!process.env.DODO_SECRET_KEY) {
    console.error('create-checkout: DODO_SECRET_KEY env var is not set')
    return res.status(500).json({ error: 'Payment service not configured (missing API key).' })
  }

  try {
    const dodoRes = await fetch('https://api.dodopayments.com/payments', {
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
        metadata: { credits: String(credits), ...(userId ? { user_id: userId } : {}) },
      }),
    })

    const data = await dodoRes.json() as { payment_link?: string; payment_id?: string; [key: string]: unknown }
    console.log('Dodo create-payment response:', JSON.stringify(data))

    if (!dodoRes.ok) throw new Error(JSON.stringify(data))

    if (!data.payment_link) {
      console.error('Dodo response missing payment_link:', JSON.stringify(data))
      throw new Error('Dodo did not return a payment link.')
    }

    return res.status(200).json({ checkoutUrl: data.payment_link, paymentId: data.payment_id })
  } catch (err) {
    console.error('create-checkout error:', err)
    return res.status(500).json({ error: String(err) })
  }
}
