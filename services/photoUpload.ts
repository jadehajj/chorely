import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/services/firebase';

export async function uploadCompletionPhoto(
  familyId: string,
  localUri: string,
): Promise<string> {
  const filename = `${Date.now()}.jpg`;
  const storageRef = ref(storage, `families/${familyId}/completions/${filename}`);

  const response = await fetch(localUri);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}
