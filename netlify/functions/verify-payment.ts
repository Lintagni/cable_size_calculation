import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const paymentId = event.queryStringParameters?.payment_id
  if (!paymentId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing payment_id' }) }
  }

  try {
    const res = await fetch(`https://api.dodopayments.com/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.DODO_SECRET_KEY}` },
    })

    const data = await res.json() as { status?: string; metadata?: { credits?: string } }
    if (!res.ok) throw new Error(JSON.stringify(data))

    if (data.status !== 'succeeded') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payment not completed', status: data.status }),
      }
    }

    const credits = parseInt(data.metadata?.credits ?? '0', 10)
    if (!credits) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No credits in metadata' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: true, credits }),
    }
  } catch (err) {
    console.error('verify-payment error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}
