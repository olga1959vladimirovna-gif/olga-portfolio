import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: { sizeLimit: '6mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const pw = req.headers['x-admin-password'];
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  const { filename, dataBase64, contentType } = req.body || {};
  if (!filename || !dataBase64) {
    return res.status(400).json({ error: 'Нужны filename и dataBase64' });
  }

  try {
    const buffer = Buffer.from(dataBase64, 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await put('content-images/' + Date.now() + '-' + safeName, buffer, {
      access: 'public',
      contentType: contentType || 'image/jpeg',
      addRandomSuffix: true,
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
