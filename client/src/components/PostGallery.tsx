// client/src/components/PostGallery.tsx
// Hiện ảnh lớn + hàng ảnh nhỏ để chọn. Nhấn ảnh nhỏ để đổi ảnh lớn.

import { useState } from 'react';
import type { PostImage } from '../types';

export interface PostGalleryProps {
  images: PostImage[];
}

export function PostGallery({ images }: PostGalleryProps) {
  const [active, setActive] = useState(0);
  if (!images.length) return null;

  const current = images[active];

  return (
    <div className="post-gallery">
      <div className="post-gallery-main">
        <img src={current.url} alt="" />
      </div>
      {images.length > 1 && (
        <div className="post-gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={img._id}
              type="button"
              className={`post-gallery-thumb ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Ảnh ${i + 1}`}
            >
              <img src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
