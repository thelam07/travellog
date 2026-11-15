// client/src/components/ImageViewer.tsx
// (Mở rộng – A) Xem ảnh toàn màn hình: nền tối, ảnh trước/sau, phóng to, kéo khi đã phóng to,
// vuốt ngang trên điện thoại. Phím: Esc đóng, ← → đổi ảnh, + − phóng to / thu nhỏ, 0 về cỡ gốc.
// Vẽ bằng createPortal ra document.body để nằm trên mọi thứ, khoá cuộn trang khi mở.

import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import type { Post } from '../types';
import { timeAgo } from '../utils/format';
import { Avatar } from './Avatar';
import { LikeButton } from './LikeButton';

export interface ViewerImage {
  url: string;
  alt: string;
}

interface Props {
  images: ViewerImage[];
  startIndex?: number;
  onClose: () => void;
  /** Có bài thì hiện cột bên phải kiểu Facebook: tác giả, nội dung, nút Thích, bình luận */
  post?: Post;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const SWIPE_PX = 50;

export default function ImageViewer({ images, startIndex = 0, onClose, post }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean; onBackdrop: boolean } | null>(null);
  const many = images.length > 1;

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  const go = useCallback(
    (step: number) => {
      if (!many) return;
      setIndex((i) => (i + step + images.length) % images.length);
      reset();
    },
    [many, images.length],
  );
  const zoomBy = (delta: number) =>
    setZoom((z) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2)));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      // Đang gõ bình luận thì phím mũi tên, + − 0 là để gõ chữ, không đổi ảnh
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === '+' || e.key === '=') zoomBy(0.5);
      else if (e.key === '-') zoomBy(-0.5);
      else if (e.key === '0') reset();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [go, onClose]);

  // Kéo: đã phóng to thì di chuyển ảnh; cỡ gốc thì vuốt ngang để đổi ảnh.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    // Nhớ chỗ nhấn ngay lúc này: sau setPointerCapture, pointerup luôn báo target là khung chứ không phải ảnh
    const onBackdrop = e.target === e.currentTarget;
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, moved: false, onBackdrop };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (zoom > 1) setOffset({ x: d.ox + dx, y: d.oy + dy });
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (zoom === 1 && Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
    // Bấm vào nền tối (không kéo, không trúng ảnh) thì đóng
    else if (!d.moved && zoom === 1 && d.onBackdrop) onClose();
  };
  const onWheel = (e: WheelEvent<HTMLDivElement>) => zoomBy(e.deltaY < 0 ? 0.25 : -0.25);

  const image = images[index];
  const authorName = post ? post.author.displayName || post.author.username : '';

  return createPortal(
    <div className={`viewer${post ? ' viewer-with-panel' : ''}`} role="dialog" aria-modal="true" aria-label="Xem ảnh">
      <div
        className="viewer-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        // Gắn ở khung chứ không ở <img>: setPointerCapture chuyển dblclick về khung này
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          if (zoom > 1) reset();
          else setZoom(2);
        }}
      >
        <img
          src={image.url}
          alt={image.alt}
          draggable={false}
          className="viewer-img"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
        />

        <div className="viewer-top">
          <button type="button" className="viewer-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
          {many && (
            <span className="viewer-count">
              {index + 1} / {images.length}
            </span>
          )}
          <span className="viewer-spacer" />
          <button type="button" className="viewer-btn" onClick={() => zoomBy(0.5)} disabled={zoom >= MAX_ZOOM} aria-label="Phóng to">
            ＋
          </button>
          <button type="button" className="viewer-btn" onClick={() => zoomBy(-0.5)} disabled={zoom <= MIN_ZOOM} aria-label="Thu nhỏ">
            −
          </button>
        </div>

        {many && (
          <>
            <button type="button" className="viewer-btn viewer-prev" onClick={() => go(-1)} aria-label="Ảnh trước">
              ‹
            </button>
            <button type="button" className="viewer-btn viewer-next" onClick={() => go(1)} aria-label="Ảnh sau">
              ›
            </button>
          </>
        )}
      </div>

      {post && (
        <aside className="viewer-panel">
          <div className="viewer-author">
            <Link to={`/u/${post.author.username}`} onClick={onClose}>
              <Avatar user={post.author} size="md" />
            </Link>
            <div>
              <Link to={`/u/${post.author.username}`} onClick={onClose} className="viewer-author-name">
                {authorName}
              </Link>
              <div className="muted small">
                {timeAgo(post.createdAt)} · {post.visibility === 'public' ? '🌍 Công khai' : '🔒 Người theo dõi'}
              </div>
            </div>
          </div>
          <div className="viewer-title">{post.title}</div>
          {post.content && <p className="viewer-content">{post.content}</p>}
          <div className="viewer-actions">
            <LikeButton postId={post._id} initialLiked={post.likedByMe} initialCount={post.likeCount} />
            <span className="muted">💬 {post.commentCount}</span>
          </div>
          {/* TODO(C8): gắn danh sách + ô bình luận của C vào đây khi C xong */}
        </aside>
      )}
    </div>,
    document.body,
  );
}
