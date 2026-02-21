import { Platform } from 'react-native';
import { supabase } from '@/src/services/supabase/client';

export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateFileSize(fileSizeBytes: number): boolean {
  return fileSizeBytes <= MAX_FILE_SIZE_BYTES;
}

async function readFileAsArrayBuffer(fileUri: string): Promise<ArrayBuffer> {
  const response = await fetch(fileUri);
  return response.arrayBuffer();
}

export async function uploadChatMedia(
  userId: string,
  messageId: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  const filePath = `chat-media/${userId}/${messageId}/${fileName}`;

  if (Platform.OS === 'web') {
    // Web: fetch the blob from the object URL or data URI
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const total = blob.size;
    onProgress?.({ loaded: 0, total, percentage: 0 });

    const { error } = await supabase.storage
      .from('chat-media')
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    onProgress?.({ loaded: total, total, percentage: 100 });
  } else {
    // Native: read file as ArrayBuffer using fetch
    const arrayBuffer = await readFileAsArrayBuffer(fileUri);
    const total = arrayBuffer.byteLength;

    onProgress?.({ loaded: 0, total, percentage: 0 });

    const { error } = await supabase.storage
      .from('chat-media')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    onProgress?.({ loaded: total, total, percentage: 100 });
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from('chat-media')
    .createSignedUrl(filePath, 60 * 60); // 1 hour

  if (signedUrlError || !data?.signedUrl) {
    throw new Error(`Signed URL error: ${signedUrlError?.message ?? 'unknown'}`);
  }

  return data.signedUrl;
}
