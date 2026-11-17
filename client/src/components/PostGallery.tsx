// client/src/components/PostGallery.tsx
// Hiện ảnh lớn + hàng ảnh nhỏ để chọn. Nhấn ảnh nhỏ để đổi ảnh lớn.
// (Mở rộng – A) Nhấn ảnh lớn để mở trình xem ảnh toàn màn hình.

import { useState } from 'react';
import type { Post, PostImage } from '../types';
import ImageViewer from './ImageViewer';

export interface PostGalleryProps {
  images: PostImage[];
  /** Truyền bài thì trình xem ảnh có cột bên phải: tác giả, nút Thích, bình luận */
  post?: Post;
  /** Thêm / xoá bình luận trong trình xem ảnh thì báo cho trang chi tiết */
  onCommentCountChange?: (delta: number) => void;
}

export function PostGallery({ images, post, onCommentCountChange }: PostGalleryProps) {
  const [active, setActive] = useState(0);
  const [viewing, setViewing] = useState(false);
  if (!images.length) return null;

  const current = images[active];
  const alt = post?.title ?? 'Ảnh bài viết';

  return (
    <div className="post-gallery">
      <button type="button" className="post-gallery-main" onClick={() => setViewing(true)} aria-label="Xem ảnh toàn màn hình">
        <img src={current.url} alt="" />
      </button>
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
      {viewing && (
        <ImageViewer
          images={images.map((img, i) => ({ url: img.url, alt: `${alt} – ảnh ${i + 1}` }))}
          startIndex={active}
          post={post}
          onCommentCountChange={onCommentCountChange}
          onClose={() => setViewing(false)}
        />
      )}
    </div>
  );
}
