// client/src/hooks/useImagePreviews.ts
// Tạo URL xem trước cho File bằng URL.createObjectURL, tự thu hồi khi bỏ ảnh hoặc unmount.
// Tránh rò rỉ bộ nhớ: mỗi lần danh sách file đổi, revoke URL của file cũ rồi tạo URL mới.

import { useEffect, useState } from 'react';

export interface ImagePreview {
  file: File;
  url: string;
}

export function useImagePreviews(files: File[]): ImagePreview[] {
  const [previews, setPreviews] = useState<ImagePreview[]>([]);

  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    // Cleanup: revoke URL khi danh sách đổi hoặc component unmount
    return () => {
      for (const p of next) URL.revokeObjectURL(p.url);
    };
  }, [files]);

  return previews;
}
