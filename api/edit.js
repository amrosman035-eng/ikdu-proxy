export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, mode, prompt, search_prompt } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const buffer = Buffer.from(image, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');
    formData.append('output_format', 'jpeg');

    let endpoint = '';

    if (mode === 'search_and_replace') {
      endpoint = 'https://api.stability.ai/v2beta/stable-image/edit/search-and-replace';
      formData.append('prompt', prompt);
      formData.append('search_prompt', search_prompt);
    } else if (mode === 'remove') {
      endpoint = 'https://api.stability.ai/v2beta/stable-image/edit/erase';
    } else if (mode === 'reimagine') {
      endpoint = 'https://api.stability.ai/v2beta/stable-image/edit/search-and-replace';
      formData.append('prompt', prompt);
      formData.append('search_prompt', search_prompt);
    }

    const stabRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${process.env.STABILITY_KEY}`,
        'accept': 'image/*',
      },
      body: formData,
    });

    if (!stabRes.ok) {
      const errText = await stabRes.text();
      return res.status(stabRes.status).json({ error: errText });
    }

    const resultBuffer = await stabRes.arrayBuffer();
    const base64Result = Buffer.from(resultBuffer).toString('base64');
    res.status(200).json({ image: base64Result });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
