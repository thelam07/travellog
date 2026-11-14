// client/src/components/ImageUploader.tsx
// Chọn nhiều ảnh, xem trước, nút bỏ từng ảnh. Khi sửa bài: hiện ảnh cũ có nút bỏ, gọi onRemoveOld(id).

import { useRef, type ChangeEvent } from 'react';
import { useImagePreviews } from '../hooks/useImagePreviews';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export interface OldImage {
  _id: string;
  url: string;
}

export interface ImageUploaderProps {
  /** File mới người dùng vừa chọn */
  files: File[];
  setFiles: (files: File[]) => void;
  /** Ảnh cũ của bài (chỉ khi sửa). Bỏ ảnh cũ = gọi onRemoveOld(_id) */
  oldImages?: OldImage[];
  onRemoveOld?: (id: string) => void;
  /** Lỗi chung (vd: "tối đa 6 ảnh") */
  error?: string;
  /** Tổng số ảnh tối đa (mặc định 6) */
  maxCount?: number;
}

export function ImageUploader({
  files,
  setFiles,
  oldImages = [],
  onRemoveOld,
  error,
  maxCount = 6,
}: ImageUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  const previews = useImagePreviews(files);
  const total = files.length + oldImages.length;
  const canAdd = total < maxCount;

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    e.target.value = ''; // chọn lại đúng file vẫn kích hoạt onChange
    if (!list) return;
    const next: File[] = [];
    for (const f of Array.from(list)) {
      if (!ACCEPT.includes(f.type)) {
        alert('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
        continue;
      }
      if (f.size > MAX_SIZE) {
        alert(`Ảnh "${f.name}" vượt quá 5 MB.`);
        continue;
      }
      next.push(f);
    }
    if (!next.length) return;
    const room = maxCount - total;
    if (next.length > room) {
      alert(`Chỉ thêm được ${room} ảnh nữa (tối đa ${maxCount}).`);
      setFiles([...files, ...next.slice(0, room)]);
    } else {
      setFiles([...files, ...next]);
    }
  };

  const removeNew = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="image-uploader">
      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(',')}
        multiple
        hidden
        onChange={pick}
      />
      <div className="image-uploader-grid">
        {oldImages.map((img) => (
          <div key={img._id} className="image-uploader-item old">
            <img src={img.url} alt="" />
            <button
              type="button"
              className="image-uploader-remove"
              aria-label="Bỏ ảnh"
              onClick={() => onRemoveOld?.(img._id)}
            >
              ×
            </button>
          </div>
        ))}
        {previews.map((p, i) => (
          <div key={p.url} className="image-uploader-item">
            <img src={p.url} alt="" />
            <button
              type="button"
              className="image-uploader-remove"
              aria-label="Bỏ ảnh"
              onClick={() => removeNew(i)}
            >
              ×
            </button>
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            className="image-uploader-add"
            onClick={() => input.current?.click()}
          >
            + Thêm ảnh
          </button>
        )}
      </div>
      <div className="field-hint">
        JPG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh · {total}/{maxCount} ảnh
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
