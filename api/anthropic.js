export const config = {
  api: { bodyParser: { sizeLimit: '12mb' } },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', req.body ? Object.keys(req.body) : 'none');
    console.log('Model in body:', req.body && req.body.model);
    console.log('Key prefix:', process.env.ANTHROPIC_KEY && process.env.ANTHROPIC_KEY.slice(0, 25));

    const bodyStr = JSON.stringify(req.body);
    console.log('Body string length:', bodyStr.length);
    console.log('Body preview:', bodyStr.slice(0, 200));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: bodyStr,
    });

    const text = await response.text();
    console.log('Anthropic status:', response.status);
    console.log('Anthropic response:', text.slice(0, 300));

    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
