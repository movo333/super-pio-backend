// Vercel Serverless Function — Pi Payment Proxy
// يعمل كـ backend وسيط بين اللعبة و Pi API
// يحتفظ بـ Server API Key سرياً بعيداً عن المتصفح

const PI_API_BASE = 'https://api.minepi.com/v2';

export default async function handler(req, res) {
  // CORS — السماح للعبة بالاتصال
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, paymentId, txid } = req.body;
  const API_KEY = process.env.PI_API_KEY; // مخزّن في Vercel بشكل سري

  if (!API_KEY) {
    return res.status(500).json({ error: 'PI_API_KEY not configured' });
  }

  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId required' });
  }

  try {
    let piRes;

    if (action === 'approve') {
      piRes = await fetch(`${PI_API_BASE}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${API_KEY}` },
      });

    } else if (action === 'complete') {
      if (!txid) return res.status(400).json({ error: 'txid required' });
      piRes = await fetch(`${PI_API_BASE}/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      });

    } else if (action === 'cancel') {
      piRes = await fetch(`${PI_API_BASE}/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${API_KEY}` },
      });

    } else {
      return res.status(400).json({ error: 'Unknown action: ' + action });
    }

    const data = await piRes.text();
    console.log(`[Pi] ${action} ${paymentId} → HTTP ${piRes.status}`);
    return res.status(piRes.status).send(data);

  } catch (err) {
    console.error('[Pi] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
