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
    const { image, prompt } = req.body;
    if (!image || !prompt) return res.status(400).json({ error: 'Missing image or prompt' });

    const fullPrompt = `You are a photo editor for IKDU, a luxury Egyptian interior design brand. Edit this photo: ${prompt}. Keep the overall composition, perspective and lighting identical. Only make the requested change. Photorealistic, professionally staged, luxury aesthetic.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: fullPrompt },
            { inline_data: { mime_type: 'image/jpeg', data: image } }
          ]}],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return res.status(geminiRes.status).json({ error: err });
    }

    const data = await geminiRes.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);
    if (!imagePart) return res.status(500).json({ error: 'No image returned from Gemini' });

    res.status(200).json({ image: imagePart.inlineData.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
