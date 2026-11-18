// client/src/components/PostGallery.tsx
// Ảnh của bài dạng lưới (giống bản mẫu): 1 ảnh to, 2 ảnh chia đôi, 3 ảnh 3 cột, 4+ ảnh lưới 2 cột.
// - compact (thẻ bài ở bảng tin / Khám phá / trang cá nhân): tối đa 4 ô, ô cuối ghi "+N".
// - Trang chi tiết: hiện hết ảnh; bài 1 ảnh thì giữ nguyên tỉ lệ ảnh (không cắt, không dải xám).
// (A – mở rộng) Bấm ảnh nào thì mở trình xem ảnh đúng ảnh đó, có cột tác giả / Thích / bình luận.

import { useState } from 'react';
import type { Post, PostImage } from '../types';
import ImageViewer from './ImageViewer';

export interface PostGalleryProps {
  images: PostImage[];
  /** Truyền bài thì trình xem ảnh có cột bên phải: tác giả, nút Thích, bình luận */
  post?: Post;
  /** Thẻ bài trong danh sách: tối đa 4 ô, ô cuối "+N" */
  compact?: boolean;
  /** Thêm / xoá bình luận trong trình xem ảnh thì báo cho nơi chứa (trang chi tiết, thẻ bài) */
  onCommentCountChange?: (delta: number) => void;
}

export function PostGallery({ images, post, compact = false, onCommentCountChange }: PostGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!images.length) return null;

  const alt = post?.title ?? 'Ảnh bài viết';
  const shown = compact ? images.slice(0, 4) : images;
  const extra = images.length - shown.length;
  const single = shown.length === 1 && !compact;

  return (
    <>
      <div className={`gallery gallery-${Math.min(shown.length, 4)}${single ? ' gallery-natural' : ''}`}>
        {shown.map((img, i) => (
          <button
            type="button"
            key={img._id}
            className="gallery-item"
            onClick={() => setOpenIndex(i)}
            aria-label={`Xem ảnh ${i + 1} của ${alt}`}
          >
            <img src={img.url} alt={`${alt} – ảnh ${i + 1}`} loading="lazy" />
            {extra > 0 && i === shown.length - 1 && <span className="gallery-more">+{extra}</span>}
          </button>
        ))}
      </div>
      {openIndex !== null && (
        <ImageViewer
          images={images.map((img, i) => ({ url: img.url, alt: `${alt} – ảnh ${i + 1}` }))}
          startIndex={openIndex}
          post={post}
          onCommentCountChange={onCommentCountChange}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

export default PostGallery;
