import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  const body = request.body;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const pw = request.headers['x-admin-password'];
        if (!pw || pw !== process.env.ADMIN_PASSWORD) {
          throw new Error('Неверный пароль');
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          addRandomSuffix: true,
          maximumSizeInBytes: 15 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {},
    });
    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
}
