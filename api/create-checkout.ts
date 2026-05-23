import type { VercelRequest, VercelResponse } from '@vercel/node'

// Inlined to avoid cross-file ESM import issues on Node ≥ 22.
// Override with PRODUCT_* env vars to switch to live-mode product IDs.
const PACK_CREDITS: Record<string, number> = {
  [process.env.PRODUCT_STARTER    ?? 'pdt_0NfKWwNlgLAUIRjgrInu5']: 25,
  [process.env.PRODUCT_BOOST      ?? 'pdt_0NfKX4XJ839wZrSHM3Qkz']: 75,
  [process.env.PRODUCT_STANDARD   ?? 'pdt_0NfKXATusDEKQbyrqGX15']: 200,
  [process.env.PRODUCT_PRO_PACK   ?? 'pdt_0NfKXEVFKZn8BKSHFsJ1O']: 600,
  [process.env.PRODUCT_STUDIO     ?? 'pdt_0NfKXI6kBSG4QsZCeZ3j3']: 1500,
  [process.env.PRODUCT_ENTERPRISE ?? 'pdt_0NfKXNDghtiQ6Vn9trCKx']: 5000,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')
  // ── Top-level guard: any uncaught throw returns JSON, not Vercel's HTML error ──
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    // Guard against unparsed / null body (Vercel auto-parses JSON but can return null)
    const body = (req.body ?? {}) as { productId?: string; userId?: string | null; userEmail?: string | null }
    const { productId, userId, userEmail } = body

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' })
    }

    const credits = PACK_CREDITS[productId]
    if (!credits) {
      return res.status(400).json({ error: `Unknown product: ${productId}` })
    }

    const siteUrl = process.env.SITE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173')

    const dodoKey = process.env.DODO_SECRET_KEY
    if (!dodoKey) {
      console.error('create-checkout: DODO_SECRET_KEY env var is not set')
      return res.status(500).json({ error: 'Payment service not configured.' })
    }

    // Base URL: test.dodopayments.com for sandbox keys, live.dodopayments.com for production.
    // Override with DODO_API_URL env var if needed.
    const dodoBase = process.env.DODO_API_URL ?? 'https://test.dodopayments.com'
    console.log('Dodo API base:', dodoBase)

    // Manual timeout via AbortController (compatible with all Node.js ≥ 14)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 9000)

    let dodoRes: Response
    try {
      dodoRes = await fetch(`${dodoBase}/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${dodoKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          // CustomerRequest enum accepts { email, name } for new customer
          // or { customer_id } for existing. Omit entirely if no email known.
          ...(userEmail ? {
            customer: {
              email: userEmail,
              name:  userEmail.split('@')[0],
            },
          } : {}),
          billing: { city: 'N/A', country: 'US', state: 'N/A', street: 'N/A', zipcode: '00000' },
          product_cart: [{ product_id: productId, quantity: 1 }],
          payment_link: true,
          return_url: `${siteUrl}/payment-success`,
          metadata: {
            credits: String(credits),
            ...(userId    ? { user_id:    String(userId)    } : {}),
            ...(userEmail ? { user_email: String(userEmail) } : {}),
          },
        }),
      })
    } catch (fetchErr) {
      clearTimeout(timer)
      const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError'
      // Log the underlying cause so it appears in Vercel function logs
      const cause = (fetchErr as { cause?: unknown })?.cause
      console.error('Dodo fetch error:', String(fetchErr), '| cause:', cause)
      return res.status(500).json({
        error: isAbort
          ? 'Payment gateway timed out — please try again.'
          : `Fetch failed: ${String(fetchErr)}`,
        cause: String(cause ?? ''),
      })
    }
    clearTimeout(timer)

    // Parse Dodo response (may not be JSON if gateway is down)
    const rawText = await dodoRes.text()
    let data: { payment_link?: string; payment_id?: string; [key: string]: unknown } = {}
    try {
      data = JSON.parse(rawText)
    } catch {
      console.error('Dodo non-JSON response:', rawText.slice(0, 300))
      return res.status(502).json({ error: `Payment gateway returned unexpected response (${dodoRes.status}).` })
    }

    console.log('Dodo response:', dodoRes.status, JSON.stringify(data).slice(0, 400))

    if (!dodoRes.ok) {
      return res.status(502).json({ error: `Dodo error ${dodoRes.status}: ${JSON.stringify(data)}` })
    }

    if (!data.payment_link) {
      console.error('Dodo missing payment_link:', JSON.stringify(data))
      return res.status(502).json({ error: 'Payment gateway did not return a checkout URL.' })
    }

    return res.status(200).json({ checkoutUrl: data.payment_link, paymentId: data.payment_id })

  } catch (err) {
    // Catch-all: ensures this function always returns JSON, never Vercel's HTML 500
    console.error('create-checkout unhandled error:', err)
    return res.status(500).json({ error: `Unexpected error: ${String(err)}` })
  }
}
