export const config = {
  api: { bodyParser: { sizeLimit: '12mb' } },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, width, height } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const buffer = Buffer.from(image, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image_file', blob, 'image.jpg');
    formData.append('target_width', String(width || 1200));
    formData.append('target_height', String(height || 900));

    const clipRes = await fetch('https://clipdrop-api.co/image-upscaling/v1/upscale', {
      method: 'POST',
      headers: { 'x-api-key': process.env.CLIPDROP_KEY },
      body: formData,
    });

    if (!clipRes.ok) {
      const errText = await clipRes.text();
      return res.status(clipRes.status).json({ error: errText });
    }

    const resultBuffer = await clipRes.arrayBuffer();
    const base64Result = Buffer.from(resultBuffer).toString('base64');

    res.status(200).json({ image: base64Result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
