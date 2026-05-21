import type { Handler } from '@netlify/functions'

// Credit pack: env var → credits granted
const PACK_CONFIG: Array<{ envKey: string; credits: number }> = [
  { envKey: 'PRODUCT_STARTER',    credits: 25   },
  { envKey: 'PRODUCT_BOOST',      credits: 75   },
  { envKey: 'PRODUCT_STANDARD',   credits: 200  },
  { envKey: 'PRODUCT_PRO_PACK',   credits: 600  },
  { envKey: 'PRODUCT_STUDIO',     credits: 1500 },
  { envKey: 'PRODUCT_ENTERPRISE', credits: 5000 },
]

function creditsForProduct(productId: string): number | null {
  for (const p of PACK_CONFIG) {
    if (process.env[p.envKey] === productId) return p.credits
  }
  return null
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { productId } = JSON.parse(event.body || '{}') as { productId: string }
  const credits = creditsForProduct(productId)

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
