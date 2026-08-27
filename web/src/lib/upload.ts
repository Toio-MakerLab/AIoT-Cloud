import { domainConfig } from '@/lib/domain-config';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

interface UploadResponse {
  error: number;
  message?: string;
  data?: { url?: string };
}

/**
 * Upload any file to the server and return its public URL.
 * Uses the same endpoint as TipTap image uploads.
 */
export async function handleFileUpload(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(`File exceeds max size (${MAX_UPLOAD_SIZE / 1024 / 1024} MB)`);
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${domainConfig.VITE_API_URL}/v1/tiny-editor`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(30_000),
  });

  const json: UploadResponse = await res.json();
  if (!res.ok || json?.error !== 0 || !json?.data?.url) {
    throw new Error(json?.message || 'Upload failed');
  }

  return json.data.url;
}
